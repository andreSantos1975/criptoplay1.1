import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, subDays } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'daily'; // 'daily' or 'monthly'

  try {
    if (period === 'daily') {
      // Encontra a data mais recente que possui registros
      const lastEntry = await prisma.dailyPerformance.findFirst({
        orderBy: { date: 'desc' },
      });

      if (!lastEntry) {
        return NextResponse.json([]); // Retorna vazio se não houver dados
      }

      // Busca todos os registros daquela data, ordenados pela performance
      const dailyRanking = await prisma.dailyPerformance.findMany({
        where: { date: lastEntry.date },
        orderBy: { dailyPercentageGain: 'desc' },
        take: 20, // Pega o Top 20
        include: {
          user: {
            select: { name: true, image: true },
          },
        },
      });
      return NextResponse.json(dailyRanking);
    }

    if (period === 'monthly') {
      const today = new Date();
      const startDate = startOfMonth(today);
      const endDate = endOfMonth(today);
      
      // Agrupa por usuário e calcula a média do ganho percentual diário no mês
      const monthlyRanking = await prisma.dailyPerformance.groupBy({
        by: ['userId'],
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        _avg: {
          dailyPercentageGain: true,
        },
        orderBy: {
          _avg: {
            dailyPercentageGain: 'desc',
          },
        },
        take: 20,
      });

      // Busca os nomes dos usuários para enriquecer o resultado
      const userIds = monthlyRanking.map(r => r.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, image: true },
      });

      const usersMap = new Map(users.map(u => [u.id, u]));

      const enrichedRanking = monthlyRanking.map(r => ({
        ...r,
        user: usersMap.get(r.userId),
      }));

      return NextResponse.json(enrichedRanking);
    }

    return new NextResponse(JSON.stringify({ message: 'Período inválido' }), { status: 400 });

  } catch (error) {
    console.error(`Erro ao buscar ranking (${period}):`, error);
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ message: 'Erro desconhecido no servidor' }), { status: 500 });
  }
}