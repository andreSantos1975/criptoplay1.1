import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getCurrentPrice } from '@/lib/binance';

export const dynamic = 'force-dynamic';

const closePositionSchema = z.object({
  positionIds: z.array(z.string()).optional(),
  symbol: z.string().optional(),
  exitPrice: z.number().positive('O preço de saída deve ser positivo.'),
}).refine(data => data.positionIds || data.symbol, {
    message: "É necessário fornecer 'positionIds' ou 'symbol'.",
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

    const { positionIds, symbol, exitPrice } = validation.data;

    // --- OBTER TAXA DE CÂMBIO (USDT -> BRL) ---
    // Fazemos isso fora da transação para não bloquear o banco enquanto busca API externa
    let usdtBrlRate = 1;
    try {
        const rateDecimal = await getCurrentPrice('USDTBRL');
        usdtBrlRate = rateDecimal.toNumber();
    } catch (error) {
        console.error('Falha ao obter taxa USDTBRL para fechamento. Usando 1:1.', error);
    }

    const result = await prisma.$transaction(async (tx) => {
      let positionsToClose: any[] = [];

      // 1. Encontrar as posições a serem fechadas
      if (positionIds && positionIds.length > 0) {
        positionsToClose = await tx.futuresPosition.findMany({
          where: {
            id: { in: positionIds },
            userId: userId,
            status: 'OPEN',
          },
        });
      } else if (symbol) {
        positionsToClose = await tx.futuresPosition.findMany({
          where: {
            symbol: symbol,
            userId: userId,
            status: 'OPEN',
          },
        });
      }

      if (!positionsToClose || positionsToClose.length === 0) {
        throw new Error('Nenhuma posição aberta encontrada para fechar.');
      }

      let totalAmountToReturn = 0; // Acumulador em BRL (moeda da conta)
      let totalPnl = 0; // Acumulador em moeda original (apenas informativo na resposta)

      // 2. Processar cada posição
      for (const position of positionsToClose) {
        const entryPrice = position.entryPrice.toNumber();
        const quantity = position.quantity.toNumber();
        let pnl = 0;

        // Cálculo do PnL na moeda da cotação (ex: USDT)
        if (position.side === 'LONG') {
          pnl = (exitPrice - entryPrice) * quantity;
        } else { // SHORT
          pnl = (entryPrice - exitPrice) * quantity;
        }

        const margin = position.margin.toNumber();
        
        // --- CONVERSÃO PARA A MOEDA DA CONTA (BRL) ---
        let exchangeRate = 1;
        if (!position.symbol.endsWith('BRL')) {
            exchangeRate = usdtBrlRate;
        }

        // Valor a ser creditado na conta: (Margem Original + PnL) * Taxa
        const creditAmount = (margin + pnl) * exchangeRate;
        
        totalAmountToReturn += creditAmount;
        totalPnl += pnl; // Mantém PnL original para retorno da API

        // Atualizar a posição para 'CLOSED'
        // Salvamos o PnL na moeda ORIGINAL para histórico consistente
        await tx.futuresPosition.update({
          where: { id: position.id },
          data: {
            status: 'CLOSED',
            pnl: new Prisma.Decimal(pnl),
            closedAt: new Date(),
          },
        });
      }

      // 3. Atualizar o saldo do usuário (Transação única)
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          virtualBalance: {
            increment: new Prisma.Decimal(totalAmountToReturn),
          },
        },
        select: {
          virtualBalance: true,
          bankruptcyExpiryDate: true,
        }
      });

      // Lógica de falência e cooldown (até dia 1 do próximo mês)
      if (updatedUser.virtualBalance.lte(0)) {
        const now = new Date();
        const nextMonthFirstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        await tx.user.update({
          where: { id: userId },
          data: {
            virtualBalance: new Prisma.Decimal(0),
            bankruptcyExpiryDate: nextMonthFirstDay,
          },
        });
        throw new Error('Sua banca virtual foi liquidada. Você só poderá voltar a operar no dia 1º do próximo mês.');
      }

      // Se a data de expiração de falência já passou e o usuário ainda está zerado, resetar a banca
      if (updatedUser.bankruptcyExpiryDate && updatedUser.bankruptcyExpiryDate < new Date()) {
        await tx.user.update({
          where: { id: userId },
          data: {
            virtualBalance: new Prisma.Decimal(10000),
            bankruptcyExpiryDate: null,
          },
        });
      }

      return {
        message: 'Posições fechadas com sucesso',
        count: positionsToClose.length,
        totalPnl: totalPnl // Retorna PnL na moeda original (ex: USDT)
      };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao fechar posição de futuros:', error);
    if (error.message.includes('Nenhuma posição')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error.message.includes('liquidada')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}
