import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PositionStatus, Prisma } from '@prisma/client';
import { getCurrentPrice } from '@/lib/binance'; // Importar função de preço

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const { searchParams } = new URL(req.url);
    
    const period = searchParams.get('period') || '30d';
    const market = searchParams.get('market') || 'all';
    const sort = searchParams.get('sort') || 'roi';

    // --- OBTER TAXA DE CÂMBIO (USDT -> BRL) ---
    // Fazemos isso uma vez fora do loop para otimização
    let usdtBrlRate = new Prisma.Decimal(5.0); // Fallback
    try {
        usdtBrlRate = await getCurrentPrice('USDTBRL');
    } catch (error) {
        console.error('Falha ao obter taxa USDTBRL para o ranking. Usando fallback.', error);
    }

    // 1. Definir Data de Corte (StartDate)
    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (period === 'all') startDate = new Date(0); // Início dos tempos

    // 2. Configurar filtros do Prisma
    const tradeFilter = {
      status: 'CLOSED',
      exitDate: { gte: startDate }
    };

    const futuresFilter = {
      status: { in: [PositionStatus.CLOSED, PositionStatus.LIQUIDATED] },
      closedAt: { gte: startDate }
    };

    // Otimização: Selecionar apenas o necessário baseado no mercado escolhido
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
        monthlyStartingBalance: true,
        isPublicProfile: true,
        trades: includeSpot ? {
            where: tradeFilter,
            select: { pnl: true, symbol: true }
        } : false,
        futuresPositions: includeFutures ? {
            where: futuresFilter,
            select: { pnl: true, symbol: true }
        } : false
      },
    });

    const allCalculatedUserData = users.map(user => {
      // Coletar trades filtrados
      // @ts-ignore
      const spotTrades = (user.trades as any[]) || [];
      // @ts-ignore
      const futureTrades = (user.futuresPositions as any[]) || [];

      // Calcular Lucro do Período e Win Rate
      let periodProfit = new Prisma.Decimal(0); // Usar Decimal para precisão
      let winningTrades = 0;
      let totalTradesCount = 0;

      if (includeSpot) {
        spotTrades.forEach(t => {
          const pnl = new Prisma.Decimal(t.pnl || 0);
          let pnlInBrl = pnl;

          // Se o PnL não for nulo e o par não for BRL, converte
          if (!pnl.isZero() && t.symbol && !t.symbol.endsWith('BRL')) {
            pnlInBrl = pnl.times(usdtBrlRate);
          }
          
          periodProfit = periodProfit.add(pnlInBrl);
          if (pnl.isPositive()) winningTrades++;
          totalTradesCount++;
        });
      }

      if (includeFutures) {
        futureTrades.forEach(t => {
          const pnl = new Prisma.Decimal(t.pnl || 0);
          let pnlInBrl = pnl;

          // Se o PnL não for nulo e o par não for BRL, converte
          if (!pnl.isZero() && t.symbol && !t.symbol.endsWith('BRL')) {
            pnlInBrl = pnl.times(usdtBrlRate);
          }

          periodProfit = periodProfit.add(pnlInBrl);
          if (pnl.isPositive()) winningTrades++;
          totalTradesCount++;
        });
      }

      const currentBal = user.virtualBalance.toNumber();
      const periodProfitNumber = periodProfit.toNumber();
      
      // Estimar Saldo Inicial do Período: Saldo Atual - Lucro Feito no Período (em BRL)
      let estimatedStartBal = currentBal - periodProfitNumber;
      
      // Proteção contra denominador zero ou negativo
      if (estimatedStartBal <= 0) estimatedStartBal = 10000; 

      const roi = ((currentBal - estimatedStartBal) / estimatedStartBal) * 100;

      const winRate = totalTradesCount > 0 
        ? (winningTrades / totalTradesCount) * 100 
        : 0;

      // Verificar se o trial está ativo
      const isTrialActive = user.trialEndsAt ? new Date(user.trialEndsAt).getTime() > Date.now() : false;
      const plan = (user.subscriptionStatus === 'active' || isTrialActive) ? 'pro' : 'free';

      // Badges
      const badges = [];
      if (roi > 50) badges.push("proTrader");
      if (winRate > 70 && totalTradesCount > 5) badges.push("streak");

      return {
        id: user.id,
        nickname: user.username || `User ${user.id.slice(0, 4)}`,
        avatar: user.image || `https://api.dicebear.com/7.x/adventurer/png?seed=${user.id}`,
        roi: roi,
        profit: periodProfitNumber, // Envia como número
        trades: totalTradesCount,
        winRate: winRate,
        drawdown: 0, 
        plan: plan,
        badges: badges,
        isCurrentUser: user.id === currentUserId,
        isPublicProfile: user.isPublicProfile
      };
    });
    
    // O resto do arquivo permanece o mesmo...
    // ...
    // ... (Encontrar currentUser, filtrar, ordenar, etc.)
    // ...
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
            currentUserWithPosition = {
                ...currentUserFullData,
                position: publicRankingPosition + 1
            };
        }
    } else if (currentUserFullData && !currentUserFullData.isPublicProfile) {
        currentUserWithPosition = {
            ...currentUserWithPosition,
            position: undefined
        };
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