import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentPrice, getCurrentFuturesPrice } from '@/lib/binance';
import { Trade, FuturesPosition, PositionSide } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

// Helper to validate secret
const isValidSecret = (request: Request) => {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  // In development, might want to bypass or use a dev secret.
  // For production, CRON_SECRET is mandatory.
  if (process.env.NODE_ENV === 'development') return true; 
  return process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
};

export async function GET(request: Request) {
  if (!isValidSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- 1. FETCH OPEN POSITIONS ---
  const [openSpotTrades, openFuturesPositions] = await Promise.all([
    prisma.trade.findMany({ where: { status: 'OPEN', isSimulator: true } }), // Ensure we only check simulator trades
    prisma.futuresPosition.findMany({ where: { status: 'OPEN' } }),
  ]);

  if (openSpotTrades.length === 0 && openFuturesPositions.length === 0) {
    return NextResponse.json({ message: 'No open positions to process.' });
  }

  const spotPricesCache = new Map<string, Decimal>();
  const futuresPricesCache = new Map<string, Decimal>();
  const logs: string[] = [];

  const spotToClose: { id: string; exitPrice: Decimal; pnl: Decimal }[] = [];
  const futuresToClose: { id: string; exitPrice: Decimal; pnl: Decimal }[] = [];

  // --- 2. PROCESS SPOT TRADES ---
  for (const trade of openSpotTrades) {
    try {
      let currentPrice = spotPricesCache.get(trade.symbol);
      if (!currentPrice) {
        currentPrice = await getCurrentPrice(trade.symbol);
        spotPricesCache.set(trade.symbol, currentPrice);
      }

      const stopLoss = new Decimal(trade.stopLoss);
      const takeProfit = new Decimal(trade.takeProfit);
      let shouldClose = false;

      // Logic: 
      // BUY: SL is below entry, TP is above.
      // If Price <= SL -> Close
      // If Price >= TP -> Close
      if (trade.type === 'BUY') {
        if (stopLoss.greaterThan(0) && currentPrice.lessThanOrEqualTo(stopLoss)) shouldClose = true;
        else if (takeProfit.greaterThan(0) && currentPrice.greaterThanOrEqualTo(takeProfit)) shouldClose = true;
      }
      // Assuming Spot only has BUY usually, but handling SELL just in case logic expands
      else if (trade.type === 'SELL') {
        if (stopLoss.greaterThan(0) && currentPrice.greaterThanOrEqualTo(stopLoss)) shouldClose = true;
        else if (takeProfit.greaterThan(0) && currentPrice.lessThanOrEqualTo(takeProfit)) shouldClose = true;
      }

      if (shouldClose) {
        const entryPrice = new Decimal(trade.entryPrice);
        const quantity = new Decimal(trade.quantity);
        let pnl = new Decimal(0);
        
        if (trade.type === 'BUY') {
          pnl = (currentPrice.minus(entryPrice)).times(quantity);
        } else {
          pnl = (entryPrice.minus(currentPrice)).times(quantity);
        }

        spotToClose.push({ id: trade.id, exitPrice: currentPrice, pnl });
        logs.push(`Spot Trade ${trade.symbol} closed at ${currentPrice}`);
      }
    } catch (e: any) {
      logs.push(`Error processing Spot ${trade.symbol}: ${e.message}`);
    }
  }

  // --- 3. PROCESS FUTURES POSITIONS ---
  for (const pos of openFuturesPositions) {
    try {
      let currentPrice = futuresPricesCache.get(pos.symbol);
      if (!currentPrice) {
        currentPrice = await getCurrentFuturesPrice(pos.symbol);
        futuresPricesCache.set(pos.symbol, currentPrice);
      }

      const stopLoss = pos.stopLoss ? new Decimal(pos.stopLoss) : new Decimal(0);
      const takeProfit = pos.takeProfit ? new Decimal(pos.takeProfit) : new Decimal(0);
      let shouldClose = false;

      // Logic:
      // LONG: SL < Entry. Trigger if Price <= SL.
      if (pos.side === 'LONG') {
        if (stopLoss.greaterThan(0) && currentPrice.lessThanOrEqualTo(stopLoss)) shouldClose = true;
        else if (takeProfit.greaterThan(0) && currentPrice.greaterThanOrEqualTo(takeProfit)) shouldClose = true;
      }
      // SHORT: SL > Entry. Trigger if Price >= SL.
      else if (pos.side === 'SHORT') {
        if (stopLoss.greaterThan(0) && currentPrice.greaterThanOrEqualTo(stopLoss)) shouldClose = true;
        else if (takeProfit.greaterThan(0) && currentPrice.lessThanOrEqualTo(takeProfit)) shouldClose = true;
      }

      if (shouldClose) {
        const entryPrice = new Decimal(pos.entryPrice);
        const quantity = new Decimal(pos.quantity);
        let pnl = new Decimal(0);

        if (pos.side === 'LONG') {
          pnl = (currentPrice.minus(entryPrice)).times(quantity);
        } else {
          pnl = (entryPrice.minus(currentPrice)).times(quantity);
        }

        futuresToClose.push({ id: pos.id, exitPrice: currentPrice, pnl });
        logs.push(`Futures Position ${pos.symbol} (${pos.side}) closed at ${currentPrice}`);
      }
    } catch (e: any) {
      logs.push(`Error processing Futures ${pos.symbol}: ${e.message}`);
    }
  }

  // --- 4. EXECUTE UPDATES ---
  if (spotToClose.length > 0 || futuresToClose.length > 0) {
    try {
      await prisma.$transaction(async (tx) => {
        // Close Spot Trades
        for (const item of spotToClose) {
          await tx.trade.update({
            where: { id: item.id },
            data: {
              status: 'CLOSED',
              exitPrice: item.exitPrice,
              exitDate: new Date(),
              pnl: item.pnl,
            },
          });
        }
        // Close Futures Positions
        for (const item of futuresToClose) {
          await tx.futuresPosition.update({
            where: { id: item.id },
            data: {
              status: 'CLOSED',
              closedAt: new Date(),
              pnl: item.pnl,
              // Note: Ideally we should clear margin/update user balance here too, 
              // but for brevity and safety we just mark closed. 
              // The Simulator logic might need a balance reconciliation step.
            }
          });
        }
      });
    } catch (e: any) {
      return NextResponse.json({ error: `Transaction failed: ${e.message}`, logs }, { status: 500 });
    }
  }

  return NextResponse.json({
    message: 'Success',
    processedSpot: openSpotTrades.length,
    processedFutures: openFuturesPositions.length,
    closedSpot: spotToClose.length,
    closedFutures: futuresToClose.length,
    logs
  });
}