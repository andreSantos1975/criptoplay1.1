import { NextResponse } from 'next/server';

let cachedRate: number | null = null;
let lastFetchTimestamp: number = 0;

const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds

export async function GET() {
  const now = Date.now();

  if (cachedRate && now - lastFetchTimestamp < CACHE_DURATION) {
    return NextResponse.json({ usdtToBrl: cachedRate });
  }

  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=brl');
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.statusText}`);
    }
    const data = await response.json();
    const usdtToBrlRate = data.tether.brl;

    if (usdtToBrlRate === undefined) {
      throw new Error('Could not retrieve USDT to BRL rate from CoinGecko API.');
    }

    cachedRate = usdtToBrlRate;
    lastFetchTimestamp = now;

    return NextResponse.json({ usdtToBrl: usdtToBrlRate });
  } catch (error) {
    console.error('Error fetching USDT to BRL rate:', error);
    return NextResponse.json({ error: 'Failed to fetch exchange rate' }, { status: 500 });
  }
}
