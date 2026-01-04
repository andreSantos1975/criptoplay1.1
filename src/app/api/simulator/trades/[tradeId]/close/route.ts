import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getCurrentPrice } from '@/lib/binance';
import { Decimal } from '@prisma/client/runtime/library';
import { hasPremiumAccess } from '@/lib/permissions';

export async function POST(
  request: Request,
  { params }: { params: { tradeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ message: 'Não autorizado' }), { status: 401 });
    }

    if (!hasPremiumAccess(session)) {
      return new NextResponse(JSON.stringify({ message: 'Assinatura necessária ou período de teste expirado.' }), { status: 403 });
    }

    const userId = session.user.id;
    const { tradeId } = params;

    // 1. Tentar encontrar a operação na tabela Trade (Spot)
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
    });

    if (trade) {
      // --- LÓGICA PARA TRADE SPOT ---
      if (trade.userId !== userId) {
        return new NextResponse(JSON.stringify({ message: 'Você não tem permissão para fechar esta operação' }), { status: 403 });
      }
      if (trade.status !== 'OPEN') {
        return new NextResponse(JSON.stringify({ message: 'Esta operação já está fechada' }), { status: 400 });
      }

      const exitPrice = await getCurrentPrice(trade.symbol);

      let pnl;
      if (trade.type === 'BUY') {
        pnl = exitPrice.sub(trade.entryPrice).mul(trade.quantity);
      } else { 
        pnl = trade.entryPrice.sub(exitPrice).mul(trade.quantity);
      }

      // No Spot (nesta implementação), o saldo não foi debitado na abertura, então apenas adicionamos o lucro/prejuízo.
      const [updatedTrade, updatedUser] = await prisma.$transaction([
        prisma.trade.update({
          where: { id: tradeId },
          data: {
            status: 'CLOSED',
            exitPrice: exitPrice,
            exitDate: new Date(),
            pnl: pnl,
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            virtualBalance: {
              increment: pnl, 
            },
          },
        }),
      ]);

      return NextResponse.json(updatedTrade);
    }

    // 2. Se não achou em Trade, tentar em FuturesPosition
    const futuresPosition = await prisma.futuresPosition.findUnique({
      where: { id: tradeId },
    });

    if (futuresPosition) {
      // --- LÓGICA PARA FUTURES ---
      if (futuresPosition.userId !== userId) {
        return new NextResponse(JSON.stringify({ message: 'Você não tem permissão para fechar esta operação' }), { status: 403 });
      }
      if (futuresPosition.status !== 'OPEN') {
        return new NextResponse(JSON.stringify({ message: 'Esta posição já está fechada' }), { status: 400 });
      }

      const exitPrice = await getCurrentPrice(futuresPosition.symbol);
      const quantity = futuresPosition.quantity;
      const entryPrice = futuresPosition.entryPrice;

      let pnl;
      if (futuresPosition.side === 'LONG') {
        pnl = exitPrice.sub(entryPrice).mul(quantity);
      } else { // SHORT
        pnl = entryPrice.sub(exitPrice).mul(quantity);
      }

      // Em Futuros, a margem foi debitada do saldo na abertura.
      // Ao fechar, devolvemos a Margem + PnL.
      const returnAmount = futuresPosition.margin.add(pnl);

      const [updatedPosition, updatedUser] = await prisma.$transaction([
        prisma.futuresPosition.update({
          where: { id: tradeId },
          data: {
            status: 'CLOSED',
            closedAt: new Date(),
            pnl: pnl,
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            virtualBalance: {
              increment: returnAmount,
            },
          },
        }),
      ]);

      return NextResponse.json(updatedPosition);
    }

    // Se não achou em nenhum lugar
    return new NextResponse(JSON.stringify({ message: 'Operação não encontrada' }), { status: 404 });

  } catch (error) {
    console.error(`Erro ao fechar operação ${params.tradeId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido no servidor.';
    return new NextResponse(JSON.stringify({ message: errorMessage }), { status: 500 });
  }
}