import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PositionStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const { searchParams } = new URL(req.url);
    
    const period = searchParams.get('period') || '30d';
    const market = searchParams.get('market') || 'all';
    const sort = searchParams.get('sort') || 'roi';

    // Data de Corte (StartDate)
    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (period === 'all') startDate = new Date(0);

    // Filtros do Prisma
    const tradeFilter = {
      status: 'CLOSED',
      exitDate: { gte: startDate }
    };
    const futuresFilter = {
      status: { in: [PositionStatus.CLOSED, PositionStatus.LIQUIDATED] },
      closedAt: { gte: startDate }
    };

    const includeSpot = market === 'spot' || market === 'all';
    const includeFutures = market === 'futures' || market === 'all';

    const whereClause: any = {
      OR: [
        { subscriptionStatus: 'active' },
        { trialEndsAt: { gt: new Date() } },
      ],
    };
    if (currentUserId) {
      whereClause.OR.push({ id: currentUserId });
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        image: true,
        virtualBalance: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        isPublicProfile: true,
        trades: includeSpot ? {
            where: tradeFilter,
            select: { pnlInBrl: true, pnl: true } // pnl para win rate
        } : false,
        futuresPositions: includeFutures ? {
            where: futuresFilter,
            select: { pnlInBrl: true, pnl: true } // pnl para win rate
        } : false
      },
    });

    const allCalculatedUserData = users.map(user => {
      const spotTrades = (user.trades as any[]) || [];
      const futureTrades = (user.futuresPositions as any[]) || [];

      let periodProfitInBrl = new Prisma.Decimal(0);
      let winningTrades = 0;
      let totalTradesCount = 0;

      if (includeSpot) {
        spotTrades.forEach(t => {
          // Usa pnlInBrl se existir, senão usa o pnl antigo (para dados pré-migração)
          const pnlForCalc = new Prisma.Decimal(t.pnlInBrl || t.pnl || 0);
          periodProfitInBrl = periodProfitInBrl.add(pnlForCalc);
          
          // Win rate é baseado no pnl original (não BRL) para ser consistente
          if (new Prisma.Decimal(t.pnl || 0).isPositive()) {
            winningTrades++;
          }
          totalTradesCount++;
        });
      }

      if (includeFutures) {
        futureTrades.forEach(t => {
          const pnlForCalc = new Prisma.Decimal(t.pnlInBrl || 0);
          periodProfitInBrl = periodProfitInBrl.add(pnlForCalc);

          if (new Prisma.Decimal(t.pnl || 0).isPositive()) {
            winningTrades++;
          }
          totalTradesCount++;
        });
      }

      const currentBal = user.virtualBalance.toNumber();
      const periodProfitNumber = periodProfitInBrl.toNumber();
      
      let estimatedStartBal = currentBal - periodProfitNumber;
      if (estimatedStartBal <= 0) estimatedStartBal = 10000; 

      const roi = ((currentBal - estimatedStartBal) / estimatedStartBal) * 100;
      const winRate = totalTradesCount > 0 
        ? (winningTrades / totalTradesCount) * 100 
        : 0;
      
      const isTrialActive = user.trialEndsAt ? new Date(user.trialEndsAt).getTime() > Date.now() : false;
      const plan = (user.subscriptionStatus === 'active' || isTrialActive) ? 'pro' : 'free';

      const badges = [];
      if (roi > 50) badges.push("proTrader");
      if (winRate > 70 && totalTradesCount > 5) badges.push("streak");

      return {
        id: user.id,
        nickname: user.username || `User ${user.id.slice(0, 4)}`,
        avatar: user.image || `https://api.dicebear.com/7.x/adventurer/png?seed=${user.id}`,
        roi: roi,
        profit: periodProfitNumber,
        trades: totalTradesCount,
        winRate: winRate,
        drawdown: 0, 
        plan: plan,
        badges: badges,
        isCurrentUser: user.id === currentUserId,
        isPublicProfile: user.isPublicProfile
      };
    });

    const currentUserFullData = allCalculatedUserData.find(t => t.isCurrentUser);
    const publicTraders = allCalculatedUserData.filter(user => user.isPublicProfile);

    publicTraders.sort((a, b) => {
      switch (sort) {
        case 'profit':
          return b.profit - a.profit;
        case 'consistency':
          if (b.winRate === a.winRate) {
            return b.trades - a.trades;
          }
          return b.winRate - a.winRate;
        case 'roi':
        default:
          return b.roi - a.roi;
      }
    });

    const rankedPublicTraders = publicTraders.map((trader, index) => {
      const position = index + 1;
      if (position <= 10) trader.badges.push("top10");
      return { ...trader, position };
    });

    let currentUserWithPosition: any = currentUserFullData;
    if (currentUserFullData && currentUserFullData.isPublicProfile) {
        const publicRankingPosition = rankedPublicTraders.findIndex(t => t.id === currentUserFullData.id);
        if (publicRankingPosition !== -1) {
            currentUserWithPosition = { ...currentUserFullData, position: publicRankingPosition + 1 };
        }
    } else if (currentUserFullData && !currentUserFullData.isPublicProfile) {
        currentUserWithPosition = { ...currentUserFullData, position: undefined };
    }

    const activeTraders = rankedPublicTraders.filter(t => t.trades > 0);
    const top100 = activeTraders.slice(0, 100);

    const avgRoi = top100.length > 0
        ? top100.reduce((sum, t) => sum + t.roi, 0) / top100.length
        : 0;

    const avgWinRate = top100.length > 0
        ? top100.reduce((sum, t) => sum + t.winRate, 0) / top100.length
        : 0;

    const topTrader = rankedPublicTraders[0] || null;

    return NextResponse.json({
      traders: rankedPublicTraders.slice(0, 50),
      currentUser: currentUserWithPosition,
      metrics: {
        totalTraders: users.length,
        avgRoi,
        avgWinRate,
        topTraderName: topTrader ? topTrader.nickname : "-",
        topTraderRoi: topTrader ? topTrader.roi : 0
      }
    });
  } catch (error) {
    console.error("Erro na API de Ranking:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}