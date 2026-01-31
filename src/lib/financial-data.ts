import prisma from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

const INITIAL_SIMULATOR_BALANCE = 10000;

/**
 * Calculates a comprehensive and consolidated set of trading statistics for a given user.
 * This function is the single source of truth for all simulator financial data
 * based on CLOSED trades from all markets (SPOT and FUTURES).
 *
 * @param userId The ID of the user.
 * @returns An object containing all consolidated trading statistics.
 */
export async function getUserTradingStats(userId: string) {
  // 1. Fetch closed trades from both SPOT and FUTURES markets in parallel.
  // PnL from SPOT trades is already in BRL.
  // For FUTURES, we explicitly use `pnlInBrl`.
  const [spotTrades, futuresPositions] = await Promise.all([
    prisma.trade.findMany({
      where: {
        userId,
        marketType: 'SPOT',
        status: 'CLOSED',
        pnl: { not: null },
      },
      select: {
        pnl: true, // This is in BRL for SPOT trades
        exitDate: true,
      },
    }),
    prisma.futuresPosition.findMany({
      where: {
        userId,
        status: { in: ['CLOSED', 'LIQUIDATED'] },
        pnlInBrl: { not: null }, // Use pnlInBrl
      },
      select: {
        pnlInBrl: true, // Select pnlInBrl
        closedAt: true,
      },
    }),
  ]);

  // 2. Map and combine all closed trades into a single, standardized list, ensuring all PnL is in BRL.
  const mappedSpotTrades = spotTrades.map(t => ({
    pnl: t.pnl!.toNumber(), // This is already in BRL
    closedAt: t.exitDate!,
  }));

  const mappedFuturesTrades = futuresPositions.map(p => ({
    pnl: p.pnlInBrl!.toNumber(), // Use pnlInBrl, which is in BRL
    closedAt: p.closedAt!,
  }));

  const allClosedTrades = [...mappedSpotTrades, ...mappedFuturesTrades].sort(
    (a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime()
  );

  // 3. Calculate realized PnL from the sum of all closed trades.
  const realizedPnl = allClosedTrades.reduce((sum, trade) => sum + trade.pnl, 0);

  // 4. Recalculate equity and total PnL from scratch based on realized gains.
  const currentEquity = INITIAL_SIMULATOR_BALANCE + realizedPnl;
  const totalPnl = realizedPnl;
  
  const totalTrades = allClosedTrades.length;

  // If there are no closed trades, return the basic initial state.
  if (totalTrades === 0) {
    return {
      totalPnl: 0,
      currentEquity: INITIAL_SIMULATOR_BALANCE,
      realizedPnl: 0,
      totalTrades: 0,
      winRate: 0,
      profitFactor: 0,
      payoff: 0,
      maxDrawdown: 0,
      bestTrade: 0,
      worstTrade: 0,
      expectancy: 0,
    };
  }

  // 5. Calculate advanced performance metrics from the consolidated list of trades.
  let grossProfit = 0;
  let grossLoss = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let maxWin = -Infinity;
  let maxLoss = Infinity;

  let equityCurve = 0; // Tracks the cumulative PnL of closed trades
  let maxEquityCurve = 0; // Tracks the peak of the equity curve for drawdown calculation
  let maxDD = 0; // The maximum drawdown discovered

  allClosedTrades.forEach((trade) => {
    const pnl = trade.pnl;

    // Basic win/loss stats
    if (pnl > 0) {
      grossProfit += pnl;
      winningTrades++;
      if (pnl > maxWin) maxWin = pnl;
    } else if (pnl < 0) {
      grossLoss += Math.abs(pnl);
      losingTrades++;
      if (pnl < maxLoss) maxLoss = pnl;
    }

    // Calculate drawdown based on the cumulative PnL curve
    equityCurve += pnl;
    if (equityCurve > maxEquityCurve) {
      maxEquityCurve = equityCurve;
    }
    const drawdown = maxEquityCurve - equityCurve;
    if (drawdown > maxDD) {
      maxDD = drawdown;
    }
  });

  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;
  
  const avgWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
  const payoff = avgLoss === 0 ? (avgWin > 0 ? Infinity : 0) : avgWin / avgLoss;

  const winRateDecimal = totalTrades > 0 ? winningTrades / totalTrades : 0;
  const lossRateDecimal = totalTrades > 0 ? losingTrades / totalTrades : 0;
  const expectancy = (winRateDecimal * avgWin) - (lossRateDecimal * avgLoss);

  // 6. Generate data for the equity curve chart
  let runningEquity = INITIAL_SIMULATOR_BALANCE;
  const equityCurveData = [{ date: 'Início', Saldo: INITIAL_SIMULATOR_BALANCE }];
  allClosedTrades.forEach((trade) => {
    runningEquity += trade.pnl;
    equityCurveData.push({
      date: new Date(trade.closedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      Saldo: runningEquity,
    });
  });

  // 7. Return the comprehensive, consolidated statistics object, including chart data.
  return {
    totalPnl,
    currentEquity,
    realizedPnl,
    totalTrades,
    winRate,
    profitFactor,
    payoff,
    maxDrawdown: maxDD,
    bestTrade: maxWin === -Infinity ? 0 : maxWin,
    worstTrade: maxLoss === Infinity ? 0 : maxLoss,
    expectancy,
    equityCurveData, // Add equity curve data for the chart
  };
}


export async function getUserFinancialData(userId: string) {
  // This function now benefits from the robust and consolidated getUserTradingStats
  const tradingStats = await getUserTradingStats(userId);
  console.log(`[getUserFinancialData] user trading stats (consolidated):`, tradingStats);

  // Other data fetching remains the same
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId },
    select: { name: true, balance: true, bankName: true }
  });

  const recentExpenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { categoria: true, valor: true, dataVencimento: true, status: true }
  });

  const activeAlerts = await prisma.alert.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { type: true, config: true }
  });

  return {
    virtualBalance: tradingStats.currentEquity, // This is the REALIZED equity
    totalPnl: tradingStats.totalPnl, // This is the REALIZED PnL
    username: user?.username,
    bankAccounts,
    recentExpenses,
    activeAlerts
  };
}
