import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    where: {
      userId: session.user.id,
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
