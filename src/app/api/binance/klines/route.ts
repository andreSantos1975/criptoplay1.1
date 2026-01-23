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
  const limit = searchParams.get('limit') || '1000';
  const endTime = searchParams.get('endTime');

  if (!symbol || !interval) {
    return NextResponse.json({ error: 'Symbol and interval are required' }, { status: 400 });
  }

  const endTimeParam = endTime ? `&endTime=${endTime}` : '';

  try {
    const endpoints = [
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endTimeParam}`,
      `https://api1.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endTimeParam}`,
      `https://api2.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endTimeParam}`,
      `https://api3.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endTimeParam}`,
      `https://api.binance.me/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endTimeParam}`,
      `https://api-gcp.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endTimeParam}`,
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
          if (response.status === 451) {
            lastError = new Error(`Binance Restricted (451)`);
            continue;
          }
          const errorText = await response.text();
          throw new Error(`Binance API error: ${response.status} - ${errorText}`);
        }

        const data: BinanceKline[] = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        console.error(`Error fetching klines from Binance on ${url}:`, error);
        lastError = error;
        continue;
      }
    }

    // FALLBACK para Bitget (Sempre útil se a Binance bloquear)
    if (symbol) {
        try {
            console.log(`Tentando fallback Bitget para klines de ${symbol}...`);
            const bitgetIntervalMap: { [key: string]: string } = {
                '1m': '1min',
                '5m': '5min',
                '15m': '15min',
                '30m': '30min',
                '1h': '1h',
                '4h': '4h',
                '1d': '1day',
                '1w': '1week'
            };
            const bitgetInterval = bitgetIntervalMap[interval] || '1min';
            const bitgetRes = await fetch(`https://api.bitget.com/api/v2/spot/market/candles?symbol=${symbol.toUpperCase()}&granularity=${bitgetInterval}&limit=${limit}`);
            
            if (bitgetRes.ok) {
                const bitgetData = await bitgetRes.json();
                if (bitgetData.code === '00000' && Array.isArray(bitgetData.data)) {
                    // Bitget format: ["timestamp", "open", "high", "low", "close", "volume", "quoteVolume"]
                    // Binance format: [openTime, open, high, low, close, volume, closeTime, ...]
                    const normalizedData = bitgetData.data.map((k: any) => [
                        parseInt(k[0]), // openTime
                        k[1], // open
                        k[2], // high
                        k[3], // low
                        k[4], // close
                        k[5], // volume
                        parseInt(k[0]) + 60000, // closeTime (aproximado)
                        k[6], // quoteVolume
                        0, 0, 0, 0
                    ]); // Bitget retorna do mais antigo para o mais novo, igual Binance
                    return NextResponse.json(normalizedData);
                }
            }
        } catch (e) {
            console.error("Bitget Fallback failed:", e);
        }
    }

    const message = lastError instanceof Error ? lastError.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  } catch (error) {
    console.error('Error fetching klines from Binance:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
