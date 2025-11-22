import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  const targetDate = new Date();
  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth() + 1;

  const queryYear = year ? parseInt(year) : currentYear;
  const queryMonth = month ? parseInt(month) : currentMonth;

  const startDate = new Date(queryYear, queryMonth - 1, 1);
  const endDate = new Date(queryYear, queryMonth, 1);

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
      dataVencimento: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: {
      dataVencimento: 'asc',
    },
  });

  // Convert Decimal fields to number for each expense
  const expensesWithNumericValues = expenses.map((expense) => ({
    ...expense,
    valor: Number(expense.valor),
    originalValor: expense.originalValor ? Number(expense.originalValor) : null,
    savedAmount: expense.savedAmount ? Number(expense.savedAmount) : null,
  }));

  return NextResponse.json(expensesWithNumericValues);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();

  const { categoria, valor, dataVencimento, status } = data;

  if (!categoria || !valor || !dataVencimento) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const newExpense = await prisma.expense.create({
    data: {
      categoria,
      valor,
      dataVencimento: new Date(dataVencimento),
      status,
      userId: session.user.id,
    },
  });

  const response = {
    ...newExpense,
    valor: Number(newExpense.valor),
  };

  return NextResponse.json(response, { status: 201 });
}
