import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { getCurrentPrice } from '@/lib/binance';

// Esta é a função que será chamada pelo cron job diariamente
// Ela não é para ser chamada pelo frontend diretamente.
// Por segurança, podemos adicionar uma verificação de 'secret' ou 'cron job key' no futuro.

export async function POST(request: Request) {
  // --- Verificação de Segurança do Cron Job ---
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('Iniciando processo de fechamento diário do simulador...');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normaliza para o início do dia

    // 1. Obter todos os usuários que têm saldo virtual
    // (no futuro, podemos otimizar para pegar apenas usuários com operações abertas)
    const users = await prisma.user.findMany();

    for (const user of users) {
      console.log(`Processando usuário: ${user.id}`);

      const startingBalance = user.virtualBalance; // Saldo no início do processamento

      // 2. Encontrar todas as operações de SIMULATOR abertas para o usuário
      const openTrades = await prisma.trade.findMany({
        where: {
          userId: user.id,
          marketType: 'SIMULATOR',
          status: 'OPEN',
        },
      });

      if (openTrades.length === 0) {
        console.log(`Usuário ${user.id} não possui operações abertas. Pulando.`);
        // Mesmo sem operações, podemos querer salvar um registro de performance
        // se o saldo mudou por outros motivos. Por enquanto, vamos pular.
        continue;
      }

      let currentBalance = new Decimal(user.virtualBalance);

      // 3. Simular o fechamento de cada operação
      for (const trade of openTrades) {
        let currentMarketPrice: Decimal;
        try {
          // Obter o preço de mercado real da Binance
          currentMarketPrice = await getCurrentPrice(trade.symbol);
        } catch (error) {
          console.error(`Não foi possível obter o preço para ${trade.symbol}. Pulando operação ${trade.id}.`, error);
          continue; // Pula para a próxima operação
        }

        const pnl = currentMarketPrice.sub(trade.entryPrice).mul(trade.quantity);

        // Atualiza o saldo do usuário com o resultado da operação
        currentBalance = currentBalance.add(pnl);
        
        // "Fecha" a operação no banco de dados
        await prisma.trade.update({
          where: { id: trade.id },
          data: {
            exitPrice: currentMarketPrice,
            exitDate: new Date(),
            status: 'CLOSED',
            pnl: pnl,
          },
        });
        console.log(`Operação ${trade.id} fechada com PnL de ${pnl.toFixed(2)}`);
      }

      // 4. Atualizar o saldo final do usuário no banco de dados
      await prisma.user.update({
        where: { id: user.id },
        data: {
          virtualBalance: currentBalance,
        },
      });

      // 5. Calcular a performance e salvar o registro diário
      const dailyPercentageGain = startingBalance.eq(0)
        ? new Decimal(0)
        : currentBalance.sub(startingBalance).div(startingBalance).mul(100);

      await prisma.dailyPerformance.create({
        data: {
          userId: user.id,
          date: today,
          startingBalance: startingBalance,
          endingBalance: currentBalance,
          dailyPercentageGain: dailyPercentageGain.toNumber(),
        },
      });
      console.log(`Performance diária do usuário ${user.id} salva.`);
    }

    console.log('Processo de fechamento diário concluído com sucesso.');
    return NextResponse.json({ message: 'Processo de fechamento diário concluído com sucesso.' });

  } catch (error) {
    console.error('Erro no processo de fechamento diário:', error);
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ message: 'Erro desconhecido no servidor' }), { status: 500 });
  }
}