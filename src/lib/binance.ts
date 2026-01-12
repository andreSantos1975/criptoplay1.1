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
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(`Erro na API da Binance: ${errorJson.msg || 'Erro desconhecido'}`);
        } catch {
          throw new Error(`Erro na API da Binance: ${response.status} - ${errorText}`);
        }
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