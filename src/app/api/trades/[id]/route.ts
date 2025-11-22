
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// PUT /api/trades/[id] - Close a trade
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tradeId = params.id;

  try {
    // 1. Find the trade and verify ownership and status
    const tradeToClose = await prisma.trade.findFirst({
      where: {
        id: tradeId,
        userId: session.user.id,
      },
    });

    if (!tradeToClose) {
      return NextResponse.json({ error: 'Trade not found or you do not have permission' }, { status: 404 });
    }

    if (tradeToClose.status === 'CLOSED') {
      return NextResponse.json({ error: 'Trade is already closed' }, { status: 400 });
    }

    // 2. Fetch the current market price from Binance to use as exit price
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${tradeToClose.symbol}&interval=1m&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch current price from Binance: ${response.statusText}`);
    }

    const klineData = await response.json();
    if (!klineData || klineData.length === 0) {
      throw new Error('No price data returned from Binance.');
    }

    const exitPrice = new Decimal(klineData[0][4]); // Closing price of the last 1-minute candle

    // 3. Calculate Profit and Loss (P&L)
    const entryPrice = tradeToClose.entryPrice;
    const quantity = tradeToClose.quantity;
    let pnl: Decimal;

    // --- DEBUG LOG ---
    console.log('--- PNL Calculation Debug ---');
    console.log('Trade ID:', tradeId);
    console.log('Entry Price:', entryPrice.toString());
    console.log('Exit Price (from Binance):', exitPrice.toString());
    console.log('Quantity:', quantity.toString());
    // --- END DEBUG LOG ---

    if (tradeToClose.type === 'compra' || tradeToClose.type === 'long') {
      pnl = (exitPrice.minus(entryPrice)).times(quantity);
    } else { // 'venda' or 'short'
      pnl = (entryPrice.minus(exitPrice)).times(quantity);
    }

    // 4. Update the trade in the database
    const updatedTrade = await prisma.trade.update({
      where: {
        id: tradeId,
      },
      data: {
        exitPrice: exitPrice,
        exitDate: new Date(),
        status: 'CLOSED',
        pnl: pnl,
      },
    });

    return NextResponse.json(updatedTrade, { status: 200 });

  } catch (error) {
    console.error('Error closing trade:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
