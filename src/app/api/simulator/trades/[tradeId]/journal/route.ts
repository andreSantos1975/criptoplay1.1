import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tradeId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const { tradeId } = params;
  const { notes, sentiment, strategy } = await req.json();

  if (!tradeId) {
    return NextResponse.json({ message: 'ID da trade não fornecido.' }, { status: 400 });
  }

  try {
    const updatedTrade = await prisma.trade.update({
      where: {
        id: tradeId,
        userId: session.user.id, // Garante que o usuário só possa atualizar suas próprias trades
      },
      data: {
        notes: notes,
        sentiment: sentiment,
        strategy: strategy,
      },
    });

    return NextResponse.json(updatedTrade, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar diário de trade Spot:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar diário de trade Spot.' },
      { status: 500 }
    );
  }
}
