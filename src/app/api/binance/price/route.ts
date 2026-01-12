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
          const errorData = await response.json().catch(() => ({}));
          // Se for 451, continua para o próximo endpoint
          if (response.status === 451) {
            lastError = new Error(`Binance Restricted (451)`);
            continue;
          }
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

    // FALLBACK para Mercado Bitcoin ou Bitget (se a Binance bloquear)
    if (symbol) {
        try {
            const s = symbol.toUpperCase();
            if (s.endsWith('BRL')) {
                const coin = s.replace('BRL', '');
                const mbRes = await fetch(`https://www.mercadobitcoin.net/api/${coin}/ticker/`);
                if (mbRes.ok) {
                    const mbData = await mbRes.json();
                    return NextResponse.json({ symbol: s, price: mbData.ticker.last });
                }
            }
            // Fallback Bitget para qualquer símbolo
            const bitgetRes = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${s}`);
            if (bitgetRes.ok) {
                const bitgetData = await bitgetRes.json();
                if (bitgetData.code === '00000' && bitgetData.data?.[0]) {
                    return NextResponse.json({ symbol: s, price: bitgetData.data[0].lastPr });
                }
            }
        } catch (e) {
            console.error("Single symbol fallbacks failed:", e);
        }
    } else if (symbols) {
        try {
            const symbolsArray = JSON.parse(symbols);
            const results = await Promise.all(symbolsArray.map(async (s: string) => {
                const sym = s.toUpperCase();
                // Tenta Bitget primeiro para múltiplos pois é mais rápido/robusto
                try {
                    const bitgetRes = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${sym}`);
                    const bitgetData = await bitgetRes.json();
                    if (bitgetData.code === '00000' && bitgetData.data?.[0]) {
                        return { symbol: sym, price: bitgetData.data[0].lastPr };
                    }
                } catch (e) {}

                if (sym.endsWith('BRL')) {
                    const coin = sym.replace('BRL', '');
                    const mbRes = await fetch(`https://www.mercadobitcoin.net/api/${coin}/ticker/`).then(r => r.json()).catch(() => null);
                    if (mbRes?.ticker) return { symbol: sym, price: mbRes.ticker.last };
                }
                return null;
            }));
            const validResults = results.filter(r => r !== null);
            if (validResults.length > 0) return NextResponse.json(validResults);
        } catch (e) {
            console.error("Multiple symbols fallbacks failed:", e);
        }
    }

    return NextResponse.json({ error: `Failed to fetch price from Binance API: ${lastError?.message || 'Unknown error'}` }, { status: 500 });
  } catch (error) {
    console.error('Error fetching Binance price:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
