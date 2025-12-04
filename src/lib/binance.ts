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

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      // Tenta analisar o erro da Binance, que geralmente é um JSON
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
    console.error(`Falha ao buscar o preço para ${symbol}:`, error);
    // Re-lança o erro para que o chamador possa tratá-lo
    throw error;
  }
}