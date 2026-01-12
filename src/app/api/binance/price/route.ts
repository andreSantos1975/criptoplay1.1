// src/app/api/binance/price/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const symbols = searchParams.get('symbols');

  try {
    const endpoints = symbol 
      ? [
          `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
          `https://api1.binance.com/api/v3/ticker/price?symbol=${symbol}`,
          `https://api2.binance.com/api/v3/ticker/price?symbol=${symbol}`,
          `https://api3.binance.com/api/v3/ticker/price?symbol=${symbol}`,
          `https://api.binance.me/api/v3/ticker/price?symbol=${symbol}`,
          `https://api-gcp.binance.com/api/v3/ticker/price?symbol=${symbol}`,
        ]
      : symbols 
        ? [
            `https://api.binance.com/api/v3/ticker/price?symbols=${symbols}`,
            `https://api1.binance.com/api/v3/ticker/price?symbols=${symbols}`,
            `https://api2.binance.com/api/v3/ticker/price?symbols=${symbols}`,
            `https://api3.binance.com/api/v3/ticker/price?symbols=${symbols}`,
            `https://api.binance.me/api/v3/ticker/price?symbols=${symbols}`,
            `https://api-gcp.binance.com/api/v3/ticker/price?symbols=${symbols}`,
          ]
        : [`https://api.binance.com/api/v3/ticker/price`];

    let lastError: any = null;

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          next: { revalidate: 0 }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || response.statusText);
        }

        const data = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        console.error(`Binance price API error on ${url}:`, error);
        lastError = error;
        continue;
      }
    }

    return NextResponse.json({ error: `Failed to fetch price from Binance API: ${lastError?.message || 'Unknown error'}` }, { status: 500 });
  } catch (error) {
    console.error('Error fetching Binance price:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
