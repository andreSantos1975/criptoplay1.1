import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
    });
  }

  try {
    const userId = session.user.id;

    const incomes = await prisma.income.findMany({ where: { userId } });
    const expenses = await prisma.expense.findMany({ where: { userId } });

    const transactionsByMonth: { [key: string]: { income: number; expense: number } } = {};

    const processTransactions = (items: any[], type: 'income' | 'expense') => {
      items.forEach(item => {
        const month = new Date(item.date || item.dataVencimento).toISOString().slice(0, 7);
        if (!transactionsByMonth[month]) {
          transactionsByMonth[month] = { income: 0, expense: 0 };
        }
        transactionsByMonth[month][type] += parseFloat(item.amount || item.valor);
      });
    };

    processTransactions(incomes, 'income');
    processTransactions(expenses, 'expense');

    const sortedMonths = Object.keys(transactionsByMonth).sort();
    
    let cumulativeNetWorth = 0;
    const netWorthData = sortedMonths.map(month => {
      const { income, expense } = transactionsByMonth[month];
      const netChange = income - expense;
      cumulativeNetWorth += netChange;
      return {
        date: month,
        "Patrimônio Líquido": cumulativeNetWorth,
      };
    });

    return NextResponse.json(netWorthData);
  } catch (error) {
    console.error("Erro ao buscar evolução do patrimônio líquido:", error);
    return new NextResponse(
      JSON.stringify({ error: "Erro ao processar sua solicitação." }),
      { status: 500 }
    );
  }
}
