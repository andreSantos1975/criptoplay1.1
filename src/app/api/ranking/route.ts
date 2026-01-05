import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PositionStatus } from '@prisma/client'; // Importar PositionStatus diretamente

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const currentUserId = session?.user?.id;
    const { searchParams } = new URL(req.url);
    
    const period = searchParams.get('period') || '30d';
    const market = searchParams.get('market') || 'spot';
    const sort = searchParams.get('sort') || 'roi';

    // 1. Definir Data de Corte (StartDate)
    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '30d') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else if (period === 'all') startDate = new Date(0); // Início dos tempos

    // 2. Configurar filtros do Prisma
    const tradeFilter = {
      status: 'CLOSED', // O TradeStatus está como string no modelo, então 'CLOSED' funciona.
      exitDate: { gte: startDate }
    };

    const futuresFilter = {
      status: { in: [PositionStatus.CLOSED, PositionStatus.LIQUIDATED] },
      closedAt: { gte: startDate }
    };

    // Otimização: Selecionar apenas o necessário baseado no mercado escolhido
    const includeSpot = market === 'spot' || market === 'all';
    const includeFutures = market === 'futures' || market === 'all';

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        image: true,
        virtualBalance: true,
        subscriptionStatus: true,
        monthlyStartingBalance: true,
        trades: includeSpot ? {
            where: tradeFilter,
            select: { pnl: true }
        } : false,
        futuresPositions: includeFutures ? {
            where: futuresFilter,
            select: { pnl: true }
        } : false
      },
    });

    const traders = users.map(user => {
      // Coletar trades filtrados
      // @ts-ignore
      const spotTrades = (user.trades as any[]) || [];
      // @ts-ignore
      const futureTrades = (user.futuresPositions as any[]) || [];

      // Calcular Lucro do Período e Win Rate
      let periodProfit = 0;
      let winningTrades = 0;
      let totalTradesCount = 0;

      if (includeSpot) {
        spotTrades.forEach(t => {
          const pnl = Number(t.pnl || 0);
          periodProfit += pnl;
          if (pnl > 0) winningTrades++;
          totalTradesCount++;
        });
      }

      if (includeFutures) {
        futureTrades.forEach(t => {
          const pnl = Number(t.pnl || 0);
          periodProfit += pnl;
          if (pnl > 0) winningTrades++;
          totalTradesCount++;
        });
      }

      const currentBal = Number(user.virtualBalance);
      
      // Estimar Saldo Inicial do Período: Saldo Atual - Lucro Feito no Período
      // Se o lucro foi 500 e tenho 10500, comecei com 10000.
      let estimatedStartBal = currentBal - periodProfit;
      
      // Proteção contra denominador zero ou negativo (se o usuário depositou/sacou, isso distorce, mas para simulador serve)
      if (estimatedStartBal <= 0) estimatedStartBal = 10000; 

      const roi = ((currentBal - estimatedStartBal) / estimatedStartBal) * 100;

      const winRate = totalTradesCount > 0 
        ? (winningTrades / totalTradesCount) * 100 
        : 0;

      // Badges
      const badges = [];
      if (roi > 50) badges.push("proTrader");
      if (winRate > 70 && totalTradesCount > 5) badges.push("streak");

      return {
        id: user.id,
        nickname: user.username || `User ${user.id.slice(0, 4)}`,
        avatar: user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        roi: roi,
        profit: periodProfit,
        trades: totalTradesCount,
        winRate: winRate,
        drawdown: 0, 
        plan: user.subscriptionStatus === 'active' ? 'pro' : 'free',
        badges: badges,
        isCurrentUser: user.id === currentUserId
      };
    });

    // Ordenação Dinâmica
    traders.sort((a, b) => {
      switch (sort) {
        case 'profit':
          return b.profit - a.profit; // Maior lucro primeiro
        case 'consistency':
          // Prioriza Win Rate. Desempate: Quem operou mais (evita o "sortudo de 1 trade")
          if (b.winRate === a.winRate) {
            return b.trades - a.trades;
          }
          return b.winRate - a.winRate;
        case 'roi':
        default:
          return b.roi - a.roi; // Maior ROI primeiro (padrão)
      }
    });

    // Atribuir Posição e Rank Badges
    const rankedTraders = traders.map((trader, index) => {
      const position = index + 1;
      if (position <= 10) trader.badges.push("top10");
      return { ...trader, position };
    });

    // Calcular Métricas Gerais para o Top 100 (ou todos)
    const activeTraders = rankedTraders.filter(t => t.trades > 0);
    const top100 = activeTraders.slice(0, 100);

    const avgRoi = top100.length > 0
        ? top100.reduce((sum, t) => sum + t.roi, 0) / top100.length
        : 0;

    const avgWinRate = top100.length > 0
        ? top100.reduce((sum, t) => sum + t.winRate, 0) / top100.length
        : 0;

    const topTrader = rankedTraders[0] || null;

    return NextResponse.json({
      traders: rankedTraders.slice(0, 50), // Paginação simples
      currentUser: rankedTraders.find(t => t.isCurrentUser),
      metrics: {
        totalTraders: users.length, // Total real de usuários na plataforma
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