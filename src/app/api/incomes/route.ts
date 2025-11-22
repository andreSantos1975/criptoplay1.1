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

  const incomes = await prisma.income.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: startDate,
        lt: endDate,
      },
      NOT: {
        description: {
          in: ['Investimento', 'Reserva Financeira'],
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  const incomesWithNumericAmount = incomes.map((income) => ({
    ...income,
    amount: Number(income.amount),
  }));

  return NextResponse.json(incomesWithNumericAmount);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const { description, amount, date } = data;

  if (!description || !amount || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const newIncome = await prisma.income.create({
    data: {
      description,
      amount,
      date: new Date(date),
      userId: session.user.id,
    },
  });

  const response = {
    ...newIncome,
    amount: Number(newIncome.amount),
  };

  return NextResponse.json(response, { status: 201 });
}
