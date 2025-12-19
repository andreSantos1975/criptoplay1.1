import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const closePositionSchema = z.object({
  positionId: z.string().cuid('ID de posição inválido.'),
  exitPrice: z.number().positive('O preço de saída deve ser positivo.'),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json();
    const validation = closePositionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { positionId, exitPrice } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Encontrar a posição para garantir que ela pertence ao usuário e está aberta.
      const position = await tx.futuresPosition.findFirst({
        where: {
          id: positionId,
          userId: userId,
          status: 'OPEN',
        },
      });

      if (!position) {
        throw new Error('Posição não encontrada, já fechada ou não pertence ao usuário.');
      }

      // 2. Calcular o PnL (Lucro ou Prejuízo).
      const entryPrice = position.entryPrice.toNumber();
      const quantity = position.quantity.toNumber();
      let pnl: number;

      if (position.side === 'LONG') {
        pnl = (exitPrice - entryPrice) * quantity;
      } else { // SHORT
        pnl = (entryPrice - exitPrice) * quantity;
      }

      // 3. Calcular o valor total a ser devolvido ao saldo do usuário (margem + PnL).
      const margin = position.margin.toNumber();
      const amountToReturn = margin + pnl;

      // 4. Atualizar o saldo do usuário.
      await tx.user.update({
        where: { id: userId },
        data: {
          virtualBalance: {
            increment: new Prisma.Decimal(amountToReturn),
          },
        },
      });

      // 5. Atualizar a posição para 'CLOSED'.
      const closedPosition = await tx.futuresPosition.update({
        where: { id: positionId },
        data: {
          status: 'CLOSED',
          pnl: new Prisma.Decimal(pnl),
          closedAt: new Date(),
        },
      });

      return closedPosition;
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao fechar posição de futuros:', error);
    // Se o erro for o que lançamos na transação.
    if (error.message.includes('Posição não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}
