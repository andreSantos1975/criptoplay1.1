
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/trades - Fetch all trades for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const trades = await prisma.trade.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        entryDate: 'desc',
      },
    });
    return NextResponse.json(trades);
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 });
  }
}

// POST /api/trades - Create a new trade for the logged-in user
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      symbol,
      type,
      entryDate,
      entryPrice,
      quantity,
      stopLoss,
      takeProfit,
      notes,
    } = body;

    // Basic validation
    if (!symbol || !type || !entryDate || !entryPrice || !quantity || !stopLoss || !takeProfit) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tradeData = {
      symbol,
      type,
      entryDate: new Date(entryDate),
      entryPrice,
      quantity,
      stopLoss,
      takeProfit,
      notes,
      status: 'OPEN' as const,
      userId: session.user.id,
    };

    const newTrade = await prisma.trade.create({
      data: tradeData,
    });

    return NextResponse.json(newTrade, { status: 201 });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
  }
}
