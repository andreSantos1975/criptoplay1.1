import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getCurrentPrice } from '@/lib/binance';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ message: 'Não autorizado' }), { status: 401 });
    }
    const userId = session.user.id;

    const { symbol } = await req.json();

    if (!symbol || typeof symbol !== 'string') {
      return new NextResponse(JSON.stringify({ message: 'Símbolo do ativo é obrigatório' }), { status: 400 });
    }

    let exitPrice: number;
    try {
      const exitPriceDecimal = await getCurrentPrice(symbol);
      exitPrice = exitPriceDecimal.toNumber();
    } catch (error) {
      console.error('Error fetching price:', error);
      return new NextResponse(JSON.stringify({ message: 'Não foi possível obter o preço de fechamento atual do ativo.' }), { status: 500 });
    }

    // Find all open trades for the user and symbol
    const tradesToClose = await prisma.trade.findMany({
      where: {
        userId: userId,
        symbol: symbol,
        status: 'OPEN',
        isSimulator: true,
      }
    });

    if (tradesToClose.length === 0) {
      return new NextResponse(JSON.stringify({ message: 'Nenhuma operação aberta encontrada para este ativo.' }), { status: 404 });
    }
    
    const exitDate = new Date();

    // Calculate PNL for each trade and update it
    const updatedTrades = await prisma.$transaction(
      tradesToClose.map(trade => {
        const pnl = (exitPrice - Number(trade.entryPrice)) * Number(trade.quantity);
        return prisma.trade.update({
          where: { id: trade.id },
          data: {
            status: 'CLOSED',
            exitPrice: exitPrice,
            exitDate: exitDate,
            pnl: pnl,
          },
        });
      })
    );

    // Also update user's virtual balance
    const totalPnl = updatedTrades.reduce((sum, trade) => sum + (Number(trade.pnl) || 0), 0);
    
    await prisma.user.update({
        where: { id: userId },
        data: {
            virtualBalance: {
                increment: totalPnl
            }
        }
    });


    return NextResponse.json({ message: `${updatedTrades.length} operações para ${symbol} foram fechadas.` });

  } catch (error) {
    console.error(`Erro ao fechar posição para o símbolo:`, error);
    if (error instanceof Error) {
        return new NextResponse(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ message: 'Erro desconhecido no servidor' }), { status: 500 });
  }
}
