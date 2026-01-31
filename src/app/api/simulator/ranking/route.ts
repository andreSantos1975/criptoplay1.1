// src/app/api/simulator/ranking/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserTradingStats } from '@/lib/financial-data'; // Importar a fonte da verdade

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Buscar todos os usuários que podem aparecer no ranking
    const users = await prisma.user.findMany({
      where: {
        username: {
          not: null, // Apenas usuários com apelido
        },
        isPublicProfile: true, // Apenas usuários com perfil público
      },
      select: {
        id: true,
        username: true,
        image: true,
      },
    });

    // 2. Calcular o PnL de cada usuário usando a fonte da verdade
    const rankingDataPromises = users.map(async (user) => {
      // Chamar a função centralizada para obter estatísticas precisas
      const stats = await getUserTradingStats(user.id);
      
      return {
        username: user.username,
        image: user.image,
        totalPnl: stats.totalPnl, // Usar o PnL consolidado e correto
      };
    });

    const rankingData = await Promise.all(rankingDataPromises);

    // 3. Ordenar os usuários pelo PnL total em ordem decrescente
    rankingData.sort((a, b) => b.totalPnl - a.totalPnl);

    return NextResponse.json(rankingData, { status: 200 });

  } catch (error) {
    console.error('Erro ao gerar ranking consolidado:', error);
    return NextResponse.json({ message: 'Ocorreu um erro ao buscar o ranking.' }, { status: 500 });
  }
}
