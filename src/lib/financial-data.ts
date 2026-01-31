import prisma from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

const INITIAL_SIMULATOR_BALANCE = 10000;

/**
 * Calculates the user's total Profit and Loss (PnL) and current equity
 * based on the pre-aggregated DailyPerformance data. This serves as the
 * single source of truth for simulator performance.
 * @param userId The ID of the user.
 * @returns An object containing the total PnL and current equity.
 */
export async function getUserTradingStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { virtualBalance: true },
  });

  if (!user) {
    // Se o usuário não for encontrado, retorna os valores iniciais.
    return {
      totalPnl: 0,
      currentEquity: INITIAL_SIMULATOR_BALANCE,
    };
  }

  const currentEquity = user.virtualBalance.toNumber();
  // O PnL total é simplesmente a diferença entre o patrimônio atual e o saldo inicial.
  const totalPnl = currentEquity - INITIAL_SIMULATOR_BALANCE;

  return {
    totalPnl,
    currentEquity,
  };
}


export async function getUserFinancialData(userId: string) {
  // 1. Get user's trading stats (PnL and Equity) - NEW SOURCE OF TRUTH
  const tradingStats = await getUserTradingStats(userId);
  console.log(`[getUserFinancialData] user trading stats:`, tradingStats);

  // 2. Get user's general info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true }
  });

  // 3. Get real bank accounts balance
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId },
    select: { name: true, balance: true, bankName: true }
  });

  // 4. Get recent expenses (last 5)
  const recentExpenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { categoria: true, valor: true, dataVencimento: true, status: true }
  });

  // 5. Get active alerts
  const activeAlerts = await prisma.alert.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { type: true, config: true }
  });

  return {
    virtualBalance: tradingStats.currentEquity, // Use consistent equity
    totalPnl: tradingStats.totalPnl,
    username: user?.username,
    bankAccounts,
    recentExpenses,
    activeAlerts
  };
}
