import prisma from '@/lib/prisma';
import { User } from '@prisma/client';

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
