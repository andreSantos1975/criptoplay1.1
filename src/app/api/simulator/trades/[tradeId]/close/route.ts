import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getCurrentPrice } from '@/lib/binance';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(
  request: Request,
  { params }: { params: { tradeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ message: 'Não autorizado' }), { status: 401 });
    }
    const userId = session.user.id;
    const { tradeId } = params;

    // 1. Encontrar a operação que o usuário quer fechar
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    // 2. Validar a operação
    if (!trade) {
      return new NextResponse(JSON.stringify({ message: 'Operação não encontrada' }), { status: 404 });
    }
    if (trade.userId !== userId) {
      return new NextResponse(JSON.stringify({ message: 'Você não tem permissão para fechar esta operação' }), { status: 403 });
    }
    if (trade.status !== 'OPEN') {
      return new NextResponse(JSON.stringify({ message: 'Esta operação já está fechada' }), { status: 400 });
    }

    // 3. Obter o preço atual para o fechamento
    const exitPrice = await getCurrentPrice(trade.symbol);

    // 4. Calcular o Lucro ou Prejuízo (PnL)
    const pnl = exitPrice.sub(trade.entryPrice).mul(trade.quantity);

    // 5. Executar as atualizações no banco de dados como uma transação
    const [updatedTrade, updatedUser] = await prisma.$transaction([
      // a) Atualizar a operação para 'CLOSED'
      prisma.trade.update({
        where: { id: tradeId },
        data: {
          status: 'CLOSED',
          exitPrice: exitPrice,
          exitDate: new Date(),
          pnl: pnl,
        },
      }),
      // b) Atualizar o saldo virtual do usuário
      prisma.user.update({
        where: { id: userId },
        data: {
          virtualBalance: {
            increment: pnl, // Adiciona o PnL (que pode ser negativo)
          },
        },
      }),
    ]);

    return NextResponse.json(updatedTrade);

  } catch (error) {
    console.error(`Erro ao fechar operação ${params.tradeId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no servidor.';
    return new NextResponse(JSON.stringify({ message: errorMessage }), { status: 500 });
  }
}