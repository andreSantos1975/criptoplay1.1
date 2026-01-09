import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { getCurrentPrice } from '@/lib/binance';

// Esta função é chamada diariamente pelo Cron Job.
// ATUALIZADO: Agora suporta Swing Trade (Binance Futures Style).
// Não fecha mais as posições compulsoriamente. Apenas calcula o valor de mercado (Equity)
// e salva o snapshot na tabela DailyPerformance.

export async function POST(request: Request) {
  // --- Verificação de Segurança do Cron Job ---
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (secret !== process.env.CRON_SECRET) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  console.log('Iniciando processamento diário de snapshot do simulador (Swing Trade)...');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normaliza para o início do dia

    const users = await prisma.user.findMany();

    for (const user of users) {
      // O 'startingBalance' para o gráfico de performance deve ser o patrimônio total (Equity)
      // do dia anterior. Se não houver, assume o virtualBalance atual.
      // Para simplificar a lógica deste loop, vamos calcular o Equity ATUAL e salvar.
      
      const cashBalance = new Decimal(user.virtualBalance);
      let unrealizedPnlTotal = new Decimal(0);

      // 2. Encontrar todas as operações de SIMULATOR abertas para o usuário
      const openTrades = await prisma.trade.findMany({
        where: {
          userId: user.id,
          isSimulator: true,
          status: 'OPEN',
        },
      });

      // Se não tem trades abertos, o Equity é apenas o saldo em caixa.
      // Ainda assim, queremos registrar isso para ter histórico contínuo se desejado,
      // ou podemos pular se nada mudou. Vamos registrar para manter a linha do gráfico.
      
      if (openTrades.length > 0) {
        console.log(`Usuário ${user.id} possui ${openTrades.length} operações abertas. Calculando PnL não realizado...`);

        for (const trade of openTrades) {
          let currentMarketPrice: Decimal;
          try {
            currentMarketPrice = await getCurrentPrice(trade.symbol);
          } catch (error) {
            console.error(`Não foi possível obter o preço para ${trade.symbol}. Ignorando no cálculo de PnL.`, error);
            continue;
          }

          let tradePnl = new Decimal(0);

          if (trade.type === 'BUY') {
            // Long: Lucro se preço sobe
            tradePnl = currentMarketPrice.sub(trade.entryPrice).mul(trade.quantity);
          } else if (trade.type === 'SELL') {
            // Short: Lucro se preço desce
            tradePnl = trade.entryPrice.sub(currentMarketPrice).mul(trade.quantity);
          }

          unrealizedPnlTotal = unrealizedPnlTotal.add(tradePnl);
        }
      }

      // Equity = Saldo em Caixa + Lucro/Prejuízo Aberto
      const currentEquity = cashBalance.add(unrealizedPnlTotal);

      // Busca o último registro de performance para calcular o ganho percentual diário relativo
      const lastPerformance = await prisma.dailyPerformance.findFirst({
        where: { userId: user.id },
        orderBy: { date: 'desc' },
      });

      const previousEquity = lastPerformance ? lastPerformance.endingBalance : cashBalance;

      const dailyPercentageGain = previousEquity.eq(0)
        ? new Decimal(0)
        : currentEquity.sub(previousEquity).div(previousEquity).mul(100);

      // Salva ou atualiza o registro de hoje
      // Usamos upsert para garantir que se o cron rodar 2x no dia, não duplique
      await prisma.dailyPerformance.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: today,
          }
        },
        update: {
          startingBalance: previousEquity, // O final de ontem é o começo de hoje
          endingBalance: currentEquity,
          dailyPercentageGain: dailyPercentageGain.toNumber(),
        },
        create: {
          userId: user.id,
          date: today,
          startingBalance: previousEquity,
          endingBalance: currentEquity,
          dailyPercentageGain: dailyPercentageGain.toNumber(),
        },
      });

      console.log(`Snapshot salvo para usuário ${user.id}. Equity: ${currentEquity.toFixed(2)} (Caixa: ${cashBalance.toFixed(2)} + PnL: ${unrealizedPnlTotal.toFixed(2)})`);
    }

    console.log('Processo de snapshot diário concluído com sucesso.');
    return NextResponse.json({ message: 'Snapshot diário concluído.' });

  } catch (error) {
    console.error('Erro no processo diário:', error);
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ message: 'Erro desconhecido no servidor' }), { status: 500 });
  }
}
