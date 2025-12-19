import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generatePortfolioData } from "@/lib/portfolio-calculator";
import { getCurrentPrice } from "@/lib/binance";
import { Trade, CapitalMovement } from "@/lib/portfolio-calculator";

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

    // 1. Fetch all necessary data
    const trades = await prisma.trade.findMany({ where: { userId } });
    const capitalMovements = await prisma.capitalMovement.findMany({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // 2. Fetch the current USDT to BRL exchange rate
    const usdtToBrlRate = await getCurrentPrice("USDTBRL");

    // 3. Get the user's initial balance or default to 1000
    const initialBalance = user?.virtualBalance ? user.virtualBalance.toNumber() : 10000;


    // 4. Call the centralized portfolio calculator
    const portfolioData = generatePortfolioData(
      trades as unknown as Trade[],
      capitalMovements as unknown as CapitalMovement[],
      granularity,
      usdtToBrlRate.toNumber(),
      initialBalance
    );

    // 5. Format the data for the frontend chart
    const chartData = portfolioData.map(dataPoint => ({
      date: dataPoint.date,
      "Patrimônio Líquido": dataPoint.portfolio,
    }));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Erro ao buscar evolução do patrimônio líquido:", error);
    return new NextResponse(
      JSON.stringify({ error: "Erro ao processar sua solicitação." }),
      { status: 500 }
    );
  }
}