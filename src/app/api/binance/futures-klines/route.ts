import { NextResponse } from 'next/server';

type BinanceKline = [
  number, // Open time
  string, // Open
  string, // High
  string, // Low
  string, // Close
  string, // Volume
  number, // Close time
  string, // Quote asset volume
  number, // Number of trades
  string, // Taker buy base asset volume
  string, // Taker buy quote asset volume
  string, // Ignore
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const limit = searchParams.get('limit') || '365';

  if (!symbol || !interval) {
    return NextResponse.json({ error: 'Symbol and interval are required' }, { status: 400 });
  }

  try {
    // A principal mudança está aqui: a URL base da API de Futuros
    const response = await fetch(
      `https://dapi.binance.com/dapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Binance API error: ${response.status} - ${errorText}`);
    }

    const data: BinanceKline[] = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching klines from Binance Futures:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
