import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol parameter is required' }, { status: 400 });
  }

  try {
    const url = `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || `Binance API error: ${response.statusText}`);
    }

    const data = await response.json();

    // The frontend expects a 'price' property.
    // The premiumIndex endpoint returns 'markPrice'.
    // We adapt the response to match the expected format.
    return NextResponse.json({ price: data.markPrice });

  } catch (error: any) {
    console.error(`[API_FUTURES_PRICE] Error fetching Binance Futures mark price for ${symbol}:`, error.message);
    return NextResponse.json({ error: `Failed to fetch futures mark price: ${error.message}` }, { status: 500 });
  }
}
