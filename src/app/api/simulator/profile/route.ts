// Forçando recompilação para resolver possível problema de cache de rota.
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    // 2. Buscar as operações de simulador abertas, ordenadas da mais antiga para a mais nova
    const openTrades = await prisma.trade.findMany({
      where: {
        userId: userId,
        marketType: 'SIMULATOR',
        status: 'OPEN',
      },
      orderBy: {
        entryDate: 'asc', // Ordenar por mais antigo primeiro para processamento correto
      },
    });

    // 3. Agregar as operações em posições
    const positions = new Map<string, any>();

    for (const trade of openTrades) {
      if (!positions.has(trade.symbol)) {
        // Se a posição não existe, cria uma nova
        positions.set(trade.symbol, {
          symbol: trade.symbol,
          totalQuantity: 0,
          totalInvested: 0,
          stopLoss: trade.stopLoss, // Usa o da primeira trade encontrada
          takeProfit: trade.takeProfit, // Usa o da primeira trade encontrada
          trades: [],
        });
      }

      const position = positions.get(trade.symbol);
      const tradeQuantity = Number(trade.quantity);
      const tradePrice = Number(trade.entryPrice);
      const tradeStopLoss = Number(trade.stopLoss);
      const tradeTakeProfit = Number(trade.takeProfit);

      position.totalQuantity += tradeQuantity;
      position.totalInvested += tradeQuantity * tradePrice;
      
      // Regra aprimorada: O SL/TP de uma nova operação só sobrescreve se for maior que zero.
      if (tradeStopLoss > 0) {
        position.stopLoss = trade.stopLoss;
      }
      if (tradeTakeProfit > 0) {
        position.takeProfit = trade.takeProfit;
      }
      
      position.trades.push(trade.id);
    }

    const openPositions = Array.from(positions.values()).map(pos => ({
      symbol: pos.symbol,
      totalQuantity: pos.totalQuantity,
      averageEntryPrice: Number(pos.totalInvested / pos.totalQuantity),
      stopLoss: Number(pos.stopLoss || 0), // Converte para Número e garante que não seja null
      takeProfit: Number(pos.takeProfit || 0), // Converte para Número e garante que não seja null
      tradeIds: pos.trades,
    }));


    // 4. Retornar os dados combinados com as posições agregadas
    const profileData = {
      virtualBalance: user.virtualBalance,
      openPositions: openPositions, // Retorna posições agregadas
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