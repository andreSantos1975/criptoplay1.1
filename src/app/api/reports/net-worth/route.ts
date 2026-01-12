import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generatePortfolioData } from "@/lib/portfolio-calculator";
import { getCurrentPrice } from "@/lib/binance";
import { Trade, CapitalMovement } from "@/lib/portfolio-calculator";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
    });
  }

  const { searchParams } = new URL(request.url);
  const granularity = (searchParams.get("granularity") || "monthly") as "weekly" | "monthly";


  try {
    const userId = session.user.id;

    // 1. Fetch all necessary data (Simulator Only)
    const spotTradesPromise = prisma.trade.findMany({ 
      where: { 
        userId,
        isSimulator: true
      } 
    });
    
    const futuresPositionsPromise = prisma.futuresPosition.findMany({
      where: { userId }
    });

    const [spotTrades, futuresPositions] = await Promise.all([spotTradesPromise, futuresPositionsPromise]);

    // Normalize Futures to Trade interface
    const futuresAsTrades = futuresPositions.map(pos => ({
        id: pos.id,
        symbol: pos.symbol,
        type: pos.side === 'LONG' ? 'BUY' : 'SELL',
        status: pos.status === 'LIQUIDATED' ? 'CLOSED' : pos.status, // Treat LIQUIDATED as CLOSED for PnL
        entryDate: pos.createdAt,
        exitDate: pos.closedAt,
        entryPrice: pos.entryPrice,
        exitPrice: null,
        quantity: pos.quantity,
        pnl: pos.pnl,
        userId: pos.userId,
        // Helper properties for type compatibility if needed
        marketType: 'FUTURES',
        isSimulator: true
    }));

    // Combine and sort
    const allTrades = [...spotTrades, ...futuresAsTrades].sort((a, b) => {
        return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
    });

    // Capital Movements are currently for Personal Finance only, not Simulator.
    // We should not include them in the Simulator Portfolio Evolution.
    const capitalMovements: CapitalMovement[] = [];
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // 2. Fetch the current USDT to BRL exchange rate
    let usdtToBrlRateValue = 6.0; // Fallback value
    try {
        const usdtToBrlRate = await getCurrentPrice("USDTBRL");
        usdtToBrlRateValue = usdtToBrlRate.toNumber();
    } catch (e) {
        console.error("Erro ao buscar taxa USDT/BRL, usando fallback:", e);
    }

    // 3. Set the simulation initial balance (Simulador starts with 10k)
    // We cannot use user.virtualBalance because that is the CURRENT balance (End State).
    // Using current balance as initial would double-count all profits during the replay.
    const initialBalance = 10000;


    // 4. Calculate Unrealized PnL for Open Positions
    let unrealizedPnl = 0;
    const openTrades = allTrades.filter(t => t.status === 'OPEN');
    
    if (openTrades.length > 0) {
       // Fetch prices and calculate (simplified loop)
       const symbols = Array.from(new Set(openTrades.map(t => t.symbol)));
       const priceMap = new Map<string, number>();

       await Promise.all(symbols.map(async (symbol) => {
           try {
               const priceDec = await getCurrentPrice(symbol);
               priceMap.set(symbol, priceDec.toNumber());
           } catch (e) {
               console.error(`Error fetching price for ${symbol}`, e);
           }
       }));

       for (const trade of openTrades) {
           const currentPrice = priceMap.get(trade.symbol);
           if (currentPrice !== undefined) {
               const entryPrice = Number(trade.entryPrice);
               const quantity = Number(trade.quantity);
               let pnl = 0;
               // Simple Long/Short logic
               if (trade.type === 'BUY') {
                   pnl = (currentPrice - entryPrice) * quantity;
               } else {
                   pnl = (entryPrice - currentPrice) * quantity;
               }
               
               if (trade.symbol.endsWith('BRL')) {
                   unrealizedPnl += pnl;
               } else {
                   unrealizedPnl += pnl * usdtToBrlRateValue;
               }
           }
       }
    }

    // 5. Call the centralized portfolio calculator (Historical/Realized)
    const portfolioData = generatePortfolioData(
      allTrades as unknown as Trade[],
      capitalMovements as unknown as CapitalMovement[],
      granularity,
      usdtToBrlRateValue,
      initialBalance
    );

    // 6. Format and Adjust with Unrealized PnL
    const chartData = portfolioData.map(dataPoint => ({
      date: dataPoint.date,
      "Patrimônio Líquido": dataPoint.portfolio,
    }));

    // Add unrealized PnL to the last data point to reflect current Equity
    if (chartData.length > 0) {
        chartData[chartData.length - 1]["Patrimônio Líquido"] += unrealizedPnl;
    }

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Erro ao buscar evolução do patrimônio líquido:", error);
    return new NextResponse(
      JSON.stringify({ error: "Erro ao processar sua solicitação." }),
      { status: 500 }
    );
  }
}