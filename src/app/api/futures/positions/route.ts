import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Esquema de validação para a criação de uma posição
const createPositionSchema = z.object({
  symbol: z.string().min(1, "O símbolo é obrigatório."),
  side: z.enum(['LONG', 'SHORT']),
  quantity: z.number().positive("A quantidade deve ser positiva."),
  leverage: z.number().min(1).max(125, "A alavancagem deve ser entre 1 e 125."),
  entryPrice: z.number().positive("O preço de entrada deve ser positivo."),
  stopLoss: z.number().optional().nullable(),
  takeProfit: z.number().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const validation = createPositionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten() }, { status: 400 });
    }

    const { symbol, side, quantity, leverage, entryPrice, stopLoss, takeProfit } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { virtualBalance: true, bankruptcyExpiryDate: true } // Selecionar apenas o necessário
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // --- Lógica de checagem de falência (até o próximo mês) ---
    if (user.bankruptcyExpiryDate) {
      const now = new Date();
      if (now < user.bankruptcyExpiryDate) {
        // Usuário ainda está em cooldown
        const remainingDays = Math.ceil((user.bankruptcyExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return NextResponse.json(
          { error: `Você está em período de penalidade após falência. Tente novamente em ${remainingDays} dias.` },
          { status: 403 }
        );
      } else {
        // Cooldown expirou, resetar a banca e limpar a flag
        await prisma.user.update({
          where: { id: userId },
          data: {
            virtualBalance: new Prisma.Decimal(10000),
            bankruptcyExpiryDate: null,
            monthlyStartingBalance: new Prisma.Decimal(10000) // Resetar também o ponto de partida mensal
          },
        });
        // Atualizar o objeto user para que a lógica abaixo use os novos valores
        user.virtualBalance = new Prisma.Decimal(10000);
        user.bankruptcyExpiryDate = null;
      }
    }
    // --- Fim da lógica de checagem de falência ---
    
    // --- Lógica principal ---

    // --- Lógica principal ---
    // 1. Calcular a margem necessária (valor da posição / alavancagem).
    const positionValue = quantity * entryPrice;
    const margin = positionValue / leverage;

    // 2. Verificar se o usuário tem saldo suficiente.
    if (user.virtualBalance.toNumber() < margin) {
      return NextResponse.json({ error: 'Saldo virtual insuficiente para cobrir a margem.' }, { status: 400 });
    }

    // 3. Calcular o preço de liquidação (fórmula simplificada para o simulador).
    let liquidationPrice: number;
    const priceChangePerLeverage = entryPrice / leverage;

    if (side === 'LONG') {
      liquidationPrice = entryPrice - priceChangePerLeverage;
    } else { // SHORT
      liquidationPrice = entryPrice + priceChangePerLeverage;
    }
    // Garante que o preço de liquidação não seja negativo.
    if (liquidationPrice < 0) {
      liquidationPrice = 0;
    }

    // 4. Usar uma transação para garantir atomicidade.
    const [updatedUser, newPosition] = await prisma.$transaction([
      // Debitar a margem do saldo do usuário.
      prisma.user.update({
        where: { id: userId },
        data: {
          virtualBalance: {
            decrement: margin,
          },
        },
      }),
      // Criar a FuturesPosition no banco de dados.
      prisma.futuresPosition.create({
        data: {
          userId,
          symbol,
          side,
          quantity,
          leverage,
          entryPrice,
          margin,
          liquidationPrice,
          stopLoss: stopLoss ?? undefined,
          takeProfit: takeProfit ?? undefined,
          status: 'OPEN',
        },
      }),
    ]);

    return NextResponse.json(newPosition, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar posição de futuros:', error);
    return NextResponse.json({ error: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const openPositions = await prisma.futuresPosition.findMany({
      where: {
        userId,
        status: 'OPEN',
      },
      orderBy: {
        createdAt: 'asc', // Processar do mais antigo para o mais novo
      },
    });

    // Agregação de posições por Símbolo e Lado (Side)
    const positionsMap = new Map<string, any>();

    for (const pos of openPositions) {
      const key = `${pos.symbol}-${pos.side}`;

      if (!positionsMap.has(key)) {
        positionsMap.set(key, {
          symbol: pos.symbol,
          side: pos.side,
          quantity: 0,
          totalValue: 0, // Para calcular preço médio
          margin: 0,
          leverage: pos.leverage, // Assume a alavancagem da primeira (ou atualiza com a última)
          stopLoss: pos.stopLoss ? pos.stopLoss.toNumber() : null,
          takeProfit: pos.takeProfit ? pos.takeProfit.toNumber() : null,
          ids: [],
          createdAt: pos.createdAt, // Data da primeira abertura
        });
      }

      const aggregated = positionsMap.get(key);
      const qty = pos.quantity.toNumber();
      const price = pos.entryPrice.toNumber();
      
      aggregated.quantity += qty;
      aggregated.totalValue += (qty * price);
      aggregated.margin += pos.margin.toNumber();
      aggregated.ids.push(pos.id);

      // Atualiza Alavancagem, SL e TP com a operação mais recente (comportamento padrão de adicionar margem)
      aggregated.leverage = pos.leverage;
      if (pos.stopLoss) aggregated.stopLoss = pos.stopLoss.toNumber();
      if (pos.takeProfit) aggregated.takeProfit = pos.takeProfit.toNumber();
    }

    const aggregatedPositions = Array.from(positionsMap.values()).map(pos => {
      const averageEntryPrice = pos.totalValue / pos.quantity;
      
      // Recalcular preço de liquidação baseado no preço médio e alavancagem atual
      // Liquidação Long = Entry - (Entry / Leverage)
      // Liquidação Short = Entry + (Entry / Leverage)
      let liquidationPrice = 0;
      const priceChangePerLeverage = averageEntryPrice / pos.leverage;

      if (pos.side === 'LONG') {
        liquidationPrice = averageEntryPrice - priceChangePerLeverage;
      } else {
        liquidationPrice = averageEntryPrice + priceChangePerLeverage;
      }
      if (liquidationPrice < 0) liquidationPrice = 0;

      return {
        id: pos.ids[0], // ID de referência (usa o primeiro para chaves de lista, mas o array 'ids' para operações)
        ids: pos.ids, // Lista completa de IDs agregados
        symbol: pos.symbol,
        side: pos.side,
        quantity: pos.quantity,
        leverage: pos.leverage,
        entryPrice: averageEntryPrice,
        liquidationPrice: liquidationPrice,
        margin: pos.margin,
        stopLoss: pos.stopLoss,
        takeProfit: pos.takeProfit,
        pnl: null, // PnL é calculado em tempo real no front ou via atualização de preço
        createdAt: pos.createdAt,
        marketType: 'futures', // Identificador importante para o hook useVigilante
      };
    });

    return NextResponse.json(aggregatedPositions, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar posições de futuros:', error);
    return NextResponse.json({ error: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}