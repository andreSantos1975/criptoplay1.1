import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    const endpoints = [
      `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`,
      `https://fapi1.binance.com/fapi/v1/ticker/price?symbol=${symbol}`,
      `https://fapi2.binance.com/fapi/v1/ticker/price?symbol=${symbol}`,
      `https://fapi3.binance.com/fapi/v1/ticker/price?symbol=${symbol}`,
    ];

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
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.msg || response.statusText);
        }

        const data = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        console.error(`Error fetching Binance Futures price on ${url}:`, error);
        lastError = error;
        continue;
      }
    }

    return NextResponse.json({ error: `Failed to fetch futures price: ${lastError?.message || 'Unknown error'}` }, { status: 500 });
  } catch (error) {
    console.error('Error fetching Binance Futures price:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
