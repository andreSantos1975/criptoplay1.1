import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Rota para OBTER os dados do perfil do simulador de um usuário
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ message: 'Não autorizado' }), { status: 401 });
    }
    const userId = session.user.id;

    // 1. Buscar o usuário e seu saldo virtual
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        virtualBalance: true,
      },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ message: 'Usuário não encontrado' }), { status: 404 });
    }

    // 2. Buscar as operações de simulador abertas
    const openTrades = await prisma.trade.findMany({
      where: {
        userId: userId,
        marketType: 'SIMULATOR',
        status: 'OPEN',
      },
      orderBy: {
        entryDate: 'desc',
      },
    });

    // 3. Retornar os dados combinados
    const profileData = {
      virtualBalance: user.virtualBalance,
      openTrades: openTrades,
    };

    return NextResponse.json(profileData);

  } catch (error) {
    console.error('Erro ao buscar perfil do simulador:', error);
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ message: 'Erro desconhecido no servidor' }), { status: 500 });
  }
}