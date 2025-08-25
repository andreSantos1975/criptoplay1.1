import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';



export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const id = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const { description, amount, date } = data;

  if (!description || !amount || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const income = await prisma.income.findUnique({
    where: { id },
  });

  if (!income || income.userId !== session.user.id) {
    return NextResponse.json({ error: 'Income not found' }, { status: 404 });
  }

  const updatedIncome = await prisma.income.update({
    where: { id },
    data: {
      description,
      amount,
      date: new Date(date),
    },
  });

  const response = {
    ...updatedIncome,
    amount: Number(updatedIncome.amount),
  };

  return NextResponse.json(response);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const id = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const income = await prisma.income.findUnique({
    where: { id },
  });

  if (!income || income.userId !== session.user.id) {
    return NextResponse.json({ error: 'Income not found' }, { status: 404 });
  }

  await prisma.income.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
