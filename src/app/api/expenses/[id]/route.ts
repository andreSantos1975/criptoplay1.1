import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

interface Params {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  const { categoria, valor, dataVencimento, status } = data;

  if (!categoria || !valor || !dataVencimento) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!expense || expense.userId !== session.user.id) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  }

  const updatedExpense = await prisma.expense.update({
    where: { id },
    data: {
      categoria,
      valor,
      dataVencimento: new Date(dataVencimento),
      status,
    },
  });

  const response = {
    ...updatedExpense,
    valor: Number(updatedExpense.valor),
  };

  return NextResponse.json(response);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expense = await prisma.expense.findUnique({
    where: { id },
  });

  if (!expense || expense.userId !== session.user.id) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
  }

  await prisma.expense.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
