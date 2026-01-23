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
      `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endTimeParam}`,
      `https://fapi.binance.me/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}${endTimeParam}`,
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
          throw new Error(`Binance Futures API error: ${response.status} - ${errorText}`);
        }

        const data: BinanceKline[] = await response.json();
        return NextResponse.json(data);
      } catch (error) {
        console.error(`Error fetching futures klines from Binance on ${url}:`, error);
        lastError = error;
        continue;
      }
    }

    // FALLBACK para Bitget Futures
    if (symbol) {
        try {
            console.log(`Tentando fallback Bitget Futures para klines de ${symbol}...`);
            // Bitget Mix (Futures) uses '1m', '5m', '15m' etc.
            const bitgetIntervalMap: { [key: string]: string } = {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1H',
                '4h': '4H',
                '1d': '1D',
                '1w': '1W'
            };
            const bitgetInterval = bitgetIntervalMap[interval] || '1m';
            
            let productType = 'USDT-FUTURES';
            
            const bitgetRes = await fetch(`https://api.bitget.com/api/v2/mix/market/candles?symbol=${symbol.toUpperCase()}&granularity=${bitgetInterval}&productType=${productType}&limit=${limit}`);
            
            if (bitgetRes.ok) {
                const bitgetData = await bitgetRes.json();
                if (bitgetData.code === '00000' && Array.isArray(bitgetData.data)) {
                     // Bitget format: ["timestamp", "open", "high", "low", "close", "volume", "quoteVolume"]
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
                    ]);
                    return NextResponse.json(normalizedData);
                }
            }
        } catch (e) {
            console.error("Bitget Futures Fallback failed:", e);
        }
    }

    const message = lastError instanceof Error ? lastError.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  } catch (error) {
    console.error('Error fetching futures klines from Binance:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}