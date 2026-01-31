import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getCurrentPrice } from '@/lib/binance';
import { updateUserDailyPerformance } from '@/lib/ranking';

export const dynamic = 'force-dynamic';

const closePositionSchema = z.object({
  positionIds: z.array(z.string()).optional(),
  symbol: z.string().optional(),
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
    const { positionIds, symbol } = validation.data;

    // 1. Encontrar as posições a serem fechadas ANTES da transação
    // para descobrir quais preços de mercado precisamos buscar.
    const positionsToClose = await prisma.futuresPosition.findMany({
        where: {
            userId: userId,
            status: 'OPEN',
            ...(positionIds && { id: { in: positionIds } }),
            ...(symbol && { symbol: symbol }),
        },
    });

    if (positionsToClose.length === 0) {
        return NextResponse.json({ message: 'Nenhuma posição aberta encontrada para fechar.' }, { status: 200 });
    }
    
    // 2. Coletar todos os símbolos únicos e buscar seus preços atuais ANTES da transação.
    const symbolsToFetch = ['USDTBRL', ...new Set(positionsToClose.map(p => p.symbol))];
    const pricePromises = symbolsToFetch.map(s => getCurrentPrice(s).then(price => ({ symbol: s, price: price.toNumber() })));
    const prices = await Promise.all(pricePromises);
    
    const priceMap = new Map<string, number>();
    prices.forEach(p => priceMap.set(p.symbol, p.price));

    const usdtBrlRate = priceMap.get('USDTBRL') || 1;

    // 3. Iniciar a transação atômica com todos os dados externos já em mãos.
    const result = await prisma.$transaction(async (tx) => {
      let totalOriginalPnl = 0;
      let totalRealizedPnlInBrl = 0; 
      let totalMarginToReturnInBrl = 0;

      for (const position of positionsToClose) {
        const exitPrice = priceMap.get(position.symbol);
        if (!exitPrice) {
            throw new Error(`Não foi possível obter o preço de mercado para ${position.symbol}. A transação foi revertida.`);
        }
        
        const entryPrice = position.entryPrice.toNumber();
        const quantity = position.quantity.toNumber();
        let pnl = 0;

        if (position.side === 'LONG') {
          pnl = (exitPrice - entryPrice) * quantity;
        } else { // SHORT
          pnl = (entryPrice - exitPrice) * quantity;
        }

        const exchangeRate = position.symbol.endsWith('BRL') ? 1 : usdtBrlRate;
        const pnlInBrl = pnl * exchangeRate;
        
        totalOriginalPnl += pnl;
        totalRealizedPnlInBrl += pnlInBrl;
        totalMarginToReturnInBrl += position.margin.toNumber();

        await tx.futuresPosition.update({
          where: { id: position.id },
          data: {
            status: 'CLOSED',
            pnl: new Prisma.Decimal(pnl),
            pnlInBrl: new Prisma.Decimal(pnlInBrl),
            closedAt: new Date(),
          },
        });
      }

      const userBeforeUpdate = await tx.user.findUnique({
          where: { id: userId },
          select: { virtualBalance: true },
      });
      const userVirtualBalanceBeforePnl = userBeforeUpdate?.virtualBalance || new Prisma.Decimal(0);

      const amountToReturn = totalRealizedPnlInBrl + totalMarginToReturnInBrl;
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          virtualBalance: {
            increment: new Prisma.Decimal(amountToReturn),
          },
        },
        select: {
          virtualBalance: true,
          bankruptcyExpiryDate: true,
        }
      });

      await updateUserDailyPerformance(tx, userId, new Prisma.Decimal(totalRealizedPnlInBrl), userVirtualBalanceBeforePnl);

      if (updatedUser.virtualBalance.lte(0)) {
        const now = new Date();
        const nextMonthFirstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await tx.user.update({
          where: { id: userId },
          data: { virtualBalance: new Prisma.Decimal(0), bankruptcyExpiryDate: nextMonthFirstDay },
        });
        throw new Error('Sua banca virtual foi liquidada. Você só poderá voltar a operar no dia 1º do próximo mês.');
      }
      
      if (updatedUser.bankruptcyExpiryDate && updatedUser.bankruptcyExpiryDate < new Date()) {
        await tx.user.update({
          where: { id: userId },
          data: { virtualBalance: new Prisma.Decimal(10000), bankruptcyExpiryDate: null },
        });
      }

      return {
        message: 'Posições fechadas com sucesso',
        count: positionsToClose.length,
        totalPnl: totalOriginalPnl 
      };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao fechar posição de futuros:', error);
    return NextResponse.json({ error: error.message || 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}
