import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';
import { getCurrentPrice } from '@/lib/binance';


// Rota para BUSCAR todas as operações de simulação de um usuário
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ message: 'Não autorizado' }), { status: 401 });
    }

    const userId = session.user.id;

    const trades = await prisma.trade.findMany({
      where: {
        userId: userId,
        marketType: 'SIMULATOR', // Garante que estamos pegando apenas do simulador
      },
      orderBy: {
        entryDate: 'desc', // Ordena pelas mais recentes primeiro
      },
    });

    return NextResponse.json(trades);

  } catch (error) {
    console.error('Erro ao buscar operações de simulação:', error);
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ message: 'Erro desconhecido no servidor' }), { status: 500 });
  }
}

// Rota para ABRIR uma nova operação no simulador
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ message: 'Não autorizado' }), { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      symbol,   // Ex: 'BTCUSDT'
      quantity, // Quantidade do ativo a ser comprado
      type,     // 'BUY' ou 'SELL' (para short, se implementarmos)
      stopLoss,
      takeProfit
    } = body;

    if (!symbol || !quantity || !type) {
      return new NextResponse(JSON.stringify({ message: 'Parâmetros inválidos' }), { status: 400 });
    }

    let entryPrice: Decimal;
    try {
      entryPrice = await getCurrentPrice(symbol);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ativo não encontrado ou erro na API externa.';
      return new NextResponse(JSON.stringify({ message: errorMessage }), { status: 400 });
    }

    // --- 2. VERIFICAR SALDO DO USUÁRIO ---
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return new NextResponse(JSON.stringify({ message: 'Usuário não encontrado' }), { status: 404 });
    }

    const tradeCost = new Decimal(quantity).mul(entryPrice);

    // Validação de Saldo (simplificada por enquanto)
    // Uma validação mais complexa consideraria a margem e a alavancagem
    if (new Decimal(user.virtualBalance).lt(tradeCost)) {
      return new NextResponse(JSON.stringify({ message: 'Saldo virtual insuficiente' }), { status: 400 });
    }
    
    // --- 3. CRIAR A OPERAÇÃO NO BANCO DE DADOS ---
    // Nota: Nesta versão, não vamos debitar o saldo na abertura.
    // O PnL será calculado e aplicado ao saldo apenas no fechamento da operação.
    const newTrade = await prisma.trade.create({
      data: {
        userId: userId,
        symbol: symbol.toUpperCase(),
        quantity: new Decimal(quantity),
entryPrice: entryPrice,
        entryDate: new Date(),
        type: type, // 'BUY' ou 'SELL'
        status: 'OPEN',
        marketType: 'SIMULATOR',
        stopLoss: new Decimal(stopLoss),
        takeProfit: new Decimal(takeProfit),
      },
    });

    return NextResponse.json(newTrade);

  } catch (error) {
    console.error('Erro ao criar operação de simulação:', error);
    if (error instanceof Error) {
      return new NextResponse(JSON.stringify({ message: 'Erro no servidor', error: error.message }), { status: 500 });
    }
    return new NextResponse(JSON.stringify({ message: 'Erro desconhecido no servidor' }), { status: 500 });
  }
}