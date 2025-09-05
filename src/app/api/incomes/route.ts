import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const incomes = await prisma.income.findMany({
    where: {
      userId: session.user.id,
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
