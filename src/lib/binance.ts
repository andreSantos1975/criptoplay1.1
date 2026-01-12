import { Decimal } from '@prisma/client/runtime/library';

interface TickerPrice {
  symbol: string;
  price: string;
}

/**
 * Busca o preço atual de um símbolo na API da Binance.
 * @param symbol - O símbolo do par de moedas (ex: 'BTCUSDT').
 * @returns Uma Promise que resolve para um objeto Decimal com o preço atual.
 * @throws Lança um erro se o símbolo for inválido ou se a API da Binance falhar.
 */
export async function getCurrentPrice(symbol: string): Promise<Decimal> {
  if (!symbol) {
    throw new Error('O símbolo é obrigatório.');
  }

  const endpoints = [
    `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`,
    `https://api1.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`,
    `https://api2.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`,
    `https://api3.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`,
    `https://api.binance.me/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`,
    `https://api-gcp.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`,
  ];

  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        next: { revalidate: 0 } // Disable cache for price
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson: any = {};
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {}

        // Se for erro de restrição geográfica (451), tentamos o próximo ou fallback total
        if (response.status === 451) {
            console.warn(`Binance 451 Restricted on ${url}.`);
            lastError = new Error(`Binance Restricted Location (451)`);
            continue;
        }

        throw new Error(`Erro na API da Binance: ${errorJson.msg || response.statusText}`);
      }

      const data: TickerPrice = await response.json();
      
      if (!data.price) {
          throw new Error(`Resposta inválida da API da Binance para o símbolo ${symbol}`);
      }

      return new Decimal(data.price);
    } catch (error) {
      console.error(`Falha ao buscar o preço para ${symbol} em ${url}:`, error);
      lastError = error as Error;
      continue; // Tenta o próximo endpoint
    }
  }

  // FALLBACK TOTAL: Se todos os endpoints da Binance falharem por restrição (451)
  // Tentamos o Mercado Bitcoin para BRL ou Bitget para qualquer par
  try {
    if (symbol.toUpperCase().endsWith('BRL')) {
        const coin = symbol.toUpperCase().replace('BRL', '');
        console.log(`Tentando fallback Mercado Bitcoin para ${coin}...`);
        const mbResponse = await fetch(`https://www.mercadobitcoin.net/api/${coin}/ticker/`);
        if (mbResponse.ok) {
            const mbData = await mbResponse.json();
            if (mbData.ticker && mbData.ticker.last) {
                return new Decimal(mbData.ticker.last);
            }
        }
    }
    
    // Fallback Bitget (funciona para USDT e BRL)
    console.log(`Tentando fallback Bitget para ${symbol}...`);
    const bitgetRes = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol.toUpperCase()}`);
    if (bitgetRes.ok) {
        const bitgetData = await bitgetRes.json();
        if (bitgetData.code === '00000' && bitgetData.data && bitgetData.data[0]) {
            return new Decimal(bitgetData.data[0].lastPr);
        }
    }
  } catch (fallbackError) {
    console.error("Todos os fallbacks falharam:", fallbackError);
  }

  throw lastError || new Error(`Falha ao buscar o preço para ${symbol} em todos os endpoints.`);
}

/**
 * Busca o preço atual de um símbolo na API de FUTUROS da Binance.
 * @param symbol - O símbolo do par de moedas (ex: 'BTCUSDT').
 * @returns Uma Promise que resolve para um objeto Decimal com o preço atual.
 */
export async function getCurrentFuturesPrice(symbol: string): Promise<Decimal> {
  if (!symbol) {
    throw new Error('O símbolo é obrigatório.');
  }

  const endpoints = [
    `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol.toUpperCase()}`,
    `https://fapi1.binance.com/fapi/v1/ticker/price?symbol=${symbol.toUpperCase()}`,
    `https://fapi2.binance.com/fapi/v1/ticker/price?symbol=${symbol.toUpperCase()}`,
    `https://fapi3.binance.com/fapi/v1/ticker/price?symbol=${symbol.toUpperCase()}`,
  ];

  let lastError: Error | null = null;

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(`Erro na API de Futuros da Binance: ${errorJson.msg || 'Erro desconhecido'}`);
        } catch {
          throw new Error(`Erro na API de Futuros da Binance: ${response.status} - ${errorText}`);
        }
      }

      const data: TickerPrice = await response.json();
      
      if (!data.price) {
          throw new Error(`Resposta inválida da API de Futuros para o símbolo ${symbol}`);
      }

      return new Decimal(data.price);
    } catch (error) {
      console.error(`Falha ao buscar o preço futuro para ${symbol} em ${url}:`, error);
      lastError = error as Error;
      continue;
    }
  }

  throw lastError || new Error(`Falha ao buscar o preço futuro para ${symbol} em todos os endpoints.`);
}