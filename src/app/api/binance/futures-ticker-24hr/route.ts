import { NextResponse } from 'next/server';

// Endpoint para buscar dados do ticker de 24h para um símbolo de futuros
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'O parâmetro "symbol" é obrigatório.' }, { status: 400 });
  }

  try {
    // A API de ticker/24hr pode receber um único símbolo
    const response = await fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Falha ao buscar dados do ticker de 24h na Binance.');
    }

    const data = await response.json();
    
    // A API retorna um objeto único se um símbolo for especificado
    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`Erro ao buscar ticker de 24h para ${symbol}:`, errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
