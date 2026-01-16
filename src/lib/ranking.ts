import prisma from '@/lib/prisma';

/**
 * Fetches the Hall of Fame data from the MonthlyRanking table.
 * The data is ordered by year, month, and rank position to show the most
 * recent winners first.
 */
export async function getHallOfFameData() {
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

    // The logic inside the API route to handle not found is now part of the function.
    // The page component will handle the case of an empty array.
    return hallOfFameData;

  } catch (error) {
    console.error('Erro ao buscar dados do Hall da Fama:', error);
    // In a server component, throwing an error will be caught by the nearest error boundary.
    throw new Error('Falha ao carregar os dados do Hall da Fama.');
  }
}
