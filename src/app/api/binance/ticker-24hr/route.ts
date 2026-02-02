import { NextResponse } from 'next/server';

// Endpoint para buscar dados do ticker de 24h para um símbolo de Spot
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'O parâmetro "symbol" é obrigatório.' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Falha ao buscar dados do ticker de 24h na Binance (Spot).');
    }

    const data = await response.json();
    
    return NextResponse.json(data);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`Erro ao buscar ticker de 24h para ${symbol} (Spot):`, errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
