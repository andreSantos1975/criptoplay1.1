import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'O parâmetro "symbol" é obrigatório.' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.bitget.com/api/v2/spot/market/tickers?symbol=${symbol}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || 'Falha ao buscar dados do ticker de 24h na Bitget.');
    }

    const data = await response.json();

    if (data.data.length === 0) {
      return NextResponse.json({ error: 'Símbolo não encontrado na Bitget.' }, { status: 404 });
    }

    const ticker = data.data[0];

    const formattedData = {
      lastPrice: ticker.close,
      openPrice: ticker.open,
      highPrice: ticker.high24h,
      lowPrice: ticker.low24h,
    };
    
    return NextResponse.json(formattedData);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`Erro ao buscar ticker de 24h para ${symbol} (Bitget):`, errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
