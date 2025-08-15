import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit') || '365';

  if (!symbol || !interval) {
    return NextResponse.json({ error: 'Symbol and interval are required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Binance API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching klines from Binance:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
