import { NextResponse } from 'next/server';
import { getHallOfFameData } from '@/lib/ranking';

export const dynamic = 'force-dynamic';

/**
 * API route to fetch the Hall of Fame data from the MonthlyRanking table
 * by using the centralized getHallOfFameData function.
 */
export async function GET() {
  try {
    const hallOfFameData = await getHallOfFameData();

    // The getHallOfFameData function throws an error on failure, which is caught below.
    // If it returns an empty array, it's still a successful response.
    if (hallOfFameData.length === 0) {
      return NextResponse.json({ message: 'Nenhum dado encontrado no Hall da Fama.' }, { status: 404 });
    }

    return NextResponse.json(hallOfFameData);

  } catch (error) {
    // The error is already logged by the getHallOfFameData function.
    // We just return a generic server error response.
    return new NextResponse('Erro interno do servidor ao buscar o Hall da Fama.', { status: 500 });
  }
}
