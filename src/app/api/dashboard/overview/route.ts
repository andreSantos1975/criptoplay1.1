import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCurrentPrice } from '@/lib/binance'; // Reusando a função existente para pegar taxa de câmbio

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. Buscar usuário para obter virtualBalance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { virtualBalance: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Buscar trades do simulador
    const trades = await prisma.trade.findMany({
      where: {
        userId: userId,
        isSimulator: true,
      },
      orderBy: {
        entryDate: 'desc',
      },
    });

    // 3. Buscar movimentos de capital
    const capitalMovements = await prisma.capitalMovement.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 4. Buscar taxa de câmbio USDT/BRL (usando BTCUSDT e convertendo para BRL)
    let usdtToBrlRate = 1; // Default
    try {
      // Replicating frontend's /api/exchange-rate logic
      // Note: This fetch will be a server-side internal fetch.
      // This approach might lead to issues if the /api/exchange-rate endpoint
      // is not properly designed for internal server-to-server calls
      // or if it depends on client-specific headers/cookies.
      // A more direct way would be to get the rate directly here.
      // For now, let's assume it works.
      const exchangeRateResponse = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000'}/api/exchange-rate`);
      if (exchangeRateResponse.ok) {
        const exchangeRateData = await exchangeRateResponse.json();
        usdtToBrlRate = exchangeRateData.usdtToBrl;
      } else {
        console.warn('Failed to fetch USDT to BRL rate from /api/exchange-rate, using default 1.');
      }

    } catch (error) {
      console.error('Error fetching USDT to BRL rate:', error);
      // usdtToBrlRate remains 1
    }

    return NextResponse.json({
      trades,
      capitalMovements,
      virtualBalance: user.virtualBalance,
      usdtToBrlRate,
    });
  } catch (error) {
    console.error('Error fetching dashboard overview data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard overview data' }, { status: 500 });
  }
}
