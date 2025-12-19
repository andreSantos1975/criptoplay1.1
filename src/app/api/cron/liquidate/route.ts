import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PositionStatus, PositionSide } from '@prisma/client';

// Função auxiliar para buscar preço na API da Binance
async function getPrice(symbol: string): Promise<number | null> {
  try {
    // A URL base deve ser a do seu ambiente
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/binance/price?symbol=${symbol}`);
    if (!response.ok) return null;
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Falha ao buscar preço para ${symbol}:`, error);
    return null;
  }
}

export async function GET(request: Request) {
  // 1. Proteger o endpoint com um parâmetro de busca na URL
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 2. Buscar todas as posições abertas
  const openPositions = await prisma.futuresPosition.findMany({
    where: { status: PositionStatus.OPEN },
  });

  if (openPositions.length === 0) {
    return NextResponse.json({ message: 'Nenhuma posição aberta para verificar.' });
  }

  let liquidatedCount = 0;
  const positionsToUpdate: string[] = [];

  // 3. Iterar e verificar cada posição
  for (const position of openPositions) {
    const currentPrice = await getPrice(position.symbol);

    if (currentPrice === null) {
      console.warn(`Preço não encontrado para ${position.symbol}, pulando verificação.`);
      continue;
    }

    const liquidationPrice = position.liquidationPrice.toNumber();
    let shouldLiquidate = false;

    // 4. Checar a condição de liquidação
    if (position.side === PositionSide.LONG && currentPrice <= liquidationPrice) {
      shouldLiquidate = true;
    } else if (position.side === PositionSide.SHORT && currentPrice >= liquidationPrice) {
      shouldLiquidate = true;
    }

    if (shouldLiquidate) {
      liquidatedCount++;
      positionsToUpdate.push(position.id);
    }
  }

  // 5. Atualizar as posições liquidadas no banco de dados
  if (positionsToUpdate.length > 0) {
    await prisma.futuresPosition.updateMany({
      where: {
        id: { in: positionsToUpdate },
      },
      data: {
        status: PositionStatus.LIQUIDATED,
        closedAt: new Date(),
      },
    });
  }

  return NextResponse.json({
    message: 'Verificação de liquidação concluída.',
    checked: openPositions.length,
    liquidated: liquidatedCount,
  });
}
