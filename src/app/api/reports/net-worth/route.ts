import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Income, Expense } from "@prisma/client";

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

    const processTransactions = (items: (Income | Expense)[], type: "income" | "expense") => {
      items.forEach((item) => {
        const isIncome = "date" in item;
        const date = isIncome ? item.date : item.dataVencimento;
        const value = isIncome ? item.amount : item.valor;

        const month = new Date(date).toISOString().slice(0, 7);
        if (!transactionsByMonth[month]) {
          transactionsByMonth[month] = { income: 0, expense: 0 };
        }
        transactionsByMonth[month][type] += parseFloat(value.toString());
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