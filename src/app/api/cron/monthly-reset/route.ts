import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Impede cache estático
export const maxDuration = 300; // Permite rodar por até 5 minutos (limite Vercel Pro, ajuste conforme plano)

export async function GET(req: NextRequest) {
  try {
    // 1. Verificação de Segurança (CRON_SECRET)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const today = new Date();
    // O cron roda no dia 01 do mês novo, então queremos salvar os dados do mês ANTERIOR.
    // Ex: Se hoje é 01/Fevereiro, estamos fechando o ranking de Janeiro.
    const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const targetMonth = previousMonthDate.getMonth() + 1; // 1-12
    const targetYear = previousMonthDate.getFullYear();

    console.log(`Iniciando fechamento do ranking mensal: ${targetMonth}/${targetYear}`);

    // 2. Buscar todos os usuários
    // Em produção com muitos usuários, isso deveria ser paginado.
    const users = await prisma.user.findMany({
      select: {
        id: true,
        virtualBalance: true,
        monthlyStartingBalance: true,
      },
      where: {
        // Opcional: filtrar apenas quem operou ou tem saldo
      }
    });

    const rankingData: {
      userId: string;
      month: number;
      year: number;
      startingBalance: any;
      finalBalance: any;
      roiPercentage: number;
    }[] = [];

    // 3. Processar cada usuário
    for (const user of users) {
      const startBal = Number(user.monthlyStartingBalance);
      const currentBal = Number(user.virtualBalance);
      
      // Evita divisão por zero
      const safeStartBal = startBal > 0 ? startBal : 10000; 

      const roi = ((currentBal - safeStartBal) / safeStartBal) * 100;

      rankingData.push({
        userId: user.id,
        month: targetMonth,
        year: targetYear,
        startingBalance: user.monthlyStartingBalance,
        finalBalance: user.virtualBalance,
        roiPercentage: roi,
      });
    }

    // Ordenar por ROI para definir a posição no ranking
    rankingData.sort((a, b) => b.roiPercentage - a.roiPercentage);

    // 4. Salvar no Histórico (MonthlyRanking) e Atualizar User
    // Usamos transaction para garantir integridade
    await prisma.$transaction(async (tx) => {
      // Salvar histórico com posições
      for (let i = 0; i < rankingData.length; i++) {
        const data = rankingData[i];
        await tx.monthlyRanking.create({
          data: {
            ...data,
            rankPosition: i + 1, // 1º, 2º, 3º...
          },
        });
      }

      // Atualizar o ponto de partida para o PRÓXIMO mês
      // O novo 'monthlyStartingBalance' será o saldo atual de hoje.
      await tx.$executeRaw`UPDATE "User" SET "monthlyStartingBalance" = "virtualBalance"`;
    });

    return NextResponse.json({
      success: true,
      processedUsers: users.length,
      message: `Ranking de ${targetMonth}/${targetYear} fechado com sucesso.`
    });

  } catch (error) {
    console.error('Erro no cron de reset mensal:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
