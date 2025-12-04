
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentPrice } from '@/lib/binance';
import { Trade } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(request: Request) {
  // 1. Authenticate the request
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Fetch all open trades
  const openTrades = await prisma.trade.findMany({
    where: { status: 'OPEN' },
  });

  if (openTrades.length === 0) {
    return NextResponse.json({ message: 'No open trades to process.' });
  }

  const pricesCache = new Map<string, Decimal>();
  const tradesToClose: { trade: Trade; closePrice: Decimal }[] = [];
  let errors: string[] = [];

  // 3. Process each trade
  for (const trade of openTrades) {
    try {
      // Get current price, using cache if available
      let currentPrice = pricesCache.get(trade.symbol);
      if (!currentPrice) {
        currentPrice = await getCurrentPrice(trade.symbol);
        pricesCache.set(trade.symbol, currentPrice);
      }

      const { type, stopLoss, takeProfit } = trade;
      let shouldClose = false;

      // 4. Check conditions for closing
      if (type === 'BUY') {
        if (currentPrice.lessThanOrEqualTo(stopLoss)) {
          shouldClose = true;
        } else if (currentPrice.greaterThanOrEqualTo(takeProfit)) {
          shouldClose = true;
        }
      } else if (type === 'SELL') { // 'SELL'
        if (currentPrice.greaterThanOrEqualTo(stopLoss)) {
          shouldClose = true;
        } else if (currentPrice.lessThanOrEqualTo(takeProfit)) {
          shouldClose = true;
        }
      }

      if (shouldClose && currentPrice) {
        tradesToClose.push({ trade, closePrice: currentPrice });
      }
    } catch (error) {
        if (error instanceof Error) {
            errors.push(`Failed to process trade ${trade.id} for symbol ${trade.symbol}: ${error.message}`);
        } else {
            errors.push(`An unknown error occurred for trade ${trade.id}`);
        }
    }
  }

  // 5. Batch update trades to be closed
  if (tradesToClose.length > 0) {
    try {
      await prisma.$transaction(async (tx) => {
        for (const { trade, closePrice } of tradesToClose) {
          const entryPrice = new Decimal(trade.entryPrice);
          const quantity = new Decimal(trade.quantity);
          
          let pnl = new Decimal(0);
          if (trade.type === 'BUY') {
            pnl = (closePrice.minus(entryPrice)).times(quantity);
          } else { // 'SELL'
            pnl = (entryPrice.minus(closePrice)).times(quantity);
          }

          await tx.trade.update({
            where: { id: trade.id },
            data: {
              status: 'CLOSED',
              exitPrice: closePrice,
              exitDate: new Date(),
              pnl: pnl,
            },
          });
        }
      });
    } catch (error) {
        if (error instanceof Error) {
            errors.push(`Failed to close trades in database transaction: ${error.message}`);
        } else {
            errors.push(`An unknown error occurred during database transaction.`);
        }
    }
  }

  // 6. Return summary
  return NextResponse.json({
    message: 'Trade processing complete.',
    processed: openTrades.length,
    closed: tradesToClose.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

// Prisma doesn't export TradeType enum by default in a way that's easy to use on the client.
// Re-exporting or defining it here if needed by other parts of the logic.
// For this file, it's imported from @prisma/client, which is correct for server-side code.
