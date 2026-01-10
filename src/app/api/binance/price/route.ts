// src/app/api/binance/price/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    const binanceApiUrl = `https://data-api.binance.vision/api/v3/ticker/price?symbol=${symbol}`;
    const response = await fetch(binanceApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Binance API error: ${response.status} - ${JSON.stringify(errorData)}`);
      return NextResponse.json({ error: `Failed to fetch price from Binance API: ${errorData.msg || response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Binance price:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
