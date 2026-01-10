import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
    // A única mudança é a URL da API para a de futuros (fapi)
    // Adicionando headers para simular um browser e evitar bloqueio 403/418
    const response = await fetch(
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Binance Futures API Error: ${response.status} ${response.statusText} - ${errorText}`);
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