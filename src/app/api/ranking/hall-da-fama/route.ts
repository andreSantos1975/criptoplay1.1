import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * API route to fetch the Hall of Fame data from the MonthlyRanking table.
 * The data is ordered by year, month, and rank position to show the most
 * recent winners first.
 */
export async function GET() {
  try {
    const hallOfFameData = await prisma.monthlyRanking.findMany({
      // Select specific fields from the User model to avoid exposing sensitive data
      include: {
        user: {
          select: {
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

    if (!hallOfFameData) {
      return NextResponse.json({ message: 'Nenhum dado encontrado no Hall da Fama.' }, { status: 404 });
    }

    return NextResponse.json(hallOfFameData);

  } catch (error) {
    console.error('Erro ao buscar dados do Hall da Fama:', error);
    return new NextResponse('Erro interno do servidor ao buscar o Hall da Fama.', { status: 500 });
  }
}
