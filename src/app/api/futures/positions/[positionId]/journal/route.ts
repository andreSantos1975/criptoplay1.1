import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { positionId: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 });
  }

  const { positionId } = params;
  const { notes, sentiment, strategy } = await req.json();

  if (!positionId) {
    return NextResponse.json({ message: 'ID da posição não fornecido.' }, { status: 400 });
  }

  try {
    const updatedPosition = await prisma.futuresPosition.update({
      where: {
        id: positionId,
        userId: session.user.id, // Garante que o usuário só possa atualizar suas próprias posições
      },
      data: {
        notes: notes,
        sentiment: sentiment,
        strategy: strategy,
      },
    });

    return NextResponse.json(updatedPosition, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar diário de posição Futuros:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar diário de posição Futuros.' },
      { status: 500 }
    );
  }
}
