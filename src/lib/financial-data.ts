import prisma from './prisma';

export async function getUserFinancialData(userId: string) {
  // 1. Get virtual balance (simulator)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { virtualBalance: true, username: true }
  });

  // 2. Get real bank accounts balance
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId },
    select: { name: true, balance: true, bankName: true }
  });

  // 3. Get recent expenses (last 5)
  const recentExpenses = await prisma.expense.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { categoria: true, valor: true, dataVencimento: true, status: true }
  });

  // 4. Get active alerts
  const activeAlerts = await prisma.alert.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { type: true, config: true }
  });

  return {
    virtualBalance: user?.virtualBalance || 0,
    bankAccounts,
    recentExpenses,
    activeAlerts
  };
}
