import prisma from '@/lib/prisma';
import { User } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';

// Define o tipo para o cliente de transação do Prisma
type TransactionClient = Omit<
  Prisma.TransactionClient,
  '$use' | '$on' | '$connect' | '$disconnect' | '$executeRaw' | '$queryRaw'
>;

/**
 * Atualiza ou cria o registro de performance diária de um usuário após um trade.
 * Esta função deve ser chamada DENTRO de uma transação Prisma.
 * @param tx - O cliente de transação do Prisma.
 * @param userId - O ID do usuário.
 * @param pnl - O lucro ou prejuízo (Profit and Loss) do trade.
 * @param userVirtualBalance - O saldo virtual do usuário ANTES de adicionar o PnL.
 */
export async function updateUserDailyPerformance(
  tx: TransactionClient,
  userId: string,
  pnl: Decimal,
  userVirtualBalance: Decimal
) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Normaliza a data para o início do dia em UTC

  const existingPerformance = await tx.dailyPerformance.findUnique({
    where: {
      userId_date: {
        userId: userId,
        date: today,
      },
    },
  });

  const isWin = pnl.isPositive();

  if (existingPerformance) {
    // Se já existe um registro para hoje, atualiza
    const newTotalPnl = existingPerformance.totalPnl.add(pnl);
    const newEndingBalance = existingPerformance.endingBalance.add(pnl);
    const dailyPercentageGain =
      ((newEndingBalance.toNumber() - existingPerformance.startingBalance.toNumber()) /
        existingPerformance.startingBalance.toNumber()) * 100;

    await tx.dailyPerformance.update({
      where: {
        id: existingPerformance.id,
      },
      data: {
        endingBalance: newEndingBalance,
        totalPnl: newTotalPnl,
        dailyPercentageGain: dailyPercentageGain,
        totalTrades: {
          increment: 1,
        },
        winningTrades: {
          increment: isWin ? 1 : 0,
        },
      },
    });
  } else {
    // Se não existe, cria um novo registro para o dia
    const newEndingBalance = userVirtualBalance.add(pnl);
    const startingBalanceNumber = userVirtualBalance.toNumber();
    const dailyPercentageGain =
      startingBalanceNumber > 0 ? (pnl.toNumber() / startingBalanceNumber) * 100 : 0;

    await tx.dailyPerformance.create({
      data: {
        userId: userId,
        date: today,
        startingBalance: userVirtualBalance,
        endingBalance: newEndingBalance,
        totalPnl: pnl,
        dailyPercentageGain: dailyPercentageGain,
        totalTrades: 1,
        winningTrades: isWin ? 1 : 0,
      },
    });
  }
}


// Define the shape of the data after converting Decimals to numbers.
export type HallOfFameEntry = {
    id: string;
    userId: string;
    month: number;
    year: number;
    startingBalance: number;
    finalBalance: number;
    roiPercentage: number;
    rankPosition: number;
    createdAt: Date;
    user: Pick<User, 'id' | 'username' | 'image'>;
};


/**
 * Fetches the Hall of Fame data from the MonthlyRanking table.
 * The data is ordered by year, month, and rank position to show the most
 * recent winners first.
 * This function also converts Decimal types to numbers to prevent type

 * errors in the consuming components.
 */
export async function getHallOfFameData(): Promise<HallOfFameEntry[]> {
  try {
    const hallOfFameData = await prisma.monthlyRanking.findMany({
      // Select specific fields from the User model to avoid exposing sensitive data
      include: {
        user: {
          select: {
            id: true, // Needed for the avatar URL
            username: true,
            image: true,
          },
        },
      },
      // Order the results to show the most recent rankings first
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { rankPosition: 'asc' },
      ],
    });

    // Convert Decimal fields to number
    const convertedData = hallOfFameData.map(rank => ({
      ...rank,
      startingBalance: rank.startingBalance.toNumber(),
      finalBalance: rank.finalBalance.toNumber(),
      roiPercentage: rank.roiPercentage, // roiPercentage is already a number (Float in Prisma)
    }));


    return convertedData;

  } catch (error) {
    console.error('Erro ao buscar dados do Hall da Fama:', error);
    // In a server component, throwing an error will be caught by the nearest error boundary.
    throw new Error('Falha ao carregar os dados do Hall da Fama.');
  }
}
