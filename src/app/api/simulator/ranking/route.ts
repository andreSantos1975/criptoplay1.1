// src/app/api/simulator/ranking/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Buscar todos os usuários que possuem um username
    const users = await prisma.user.findMany({
      where: {
        username: {
          not: null, // Apenas usuários com apelido definido
        },
      },
      select: {
        id: true,
        username: true,
      },
    });

    const rankingData = [];

    for (const user of users) {
      // Calcular o PnL total para cada usuário
      // Considerando apenas trades que já foram fechados e têm PnL registrado
      const totalPnlResult = await prisma.trade.aggregate({
        _sum: {
          pnl: true,
        },
        where: {
          userId: user.id,
          status: 'CLOSED', // Apenas operações fechadas
          pnl: {
            not: null, // Apenas operações com PnL calculado
          },
        },
      });

      const totalPnl = totalPnlResult._sum.pnl ? totalPnlResult._sum.pnl.toNumber() : 0; // Converter para number e default 0

      rankingData.push({
        username: user.username,
        totalPnl: totalPnl,
      });
    }

    // Ordenar os usuários pelo PnL total em ordem decrescente
    rankingData.sort((a, b) => b.totalPnl - a.totalPnl);

    // Você pode limitar o ranking aqui se quiser, ex: .slice(0, 10) para top 10
    return NextResponse.json(rankingData, { status: 200 });

  } catch (error) {
    console.error('Erro ao gerar ranking:', error);
    return NextResponse.json({ message: 'Ocorreu um erro ao buscar o ranking.' }, { status: 500 });
  }
}
