import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await request.json();
  // Destructure all expected fields, including the new ones
  const { 
    categoria, 
    valor, 
    dataVencimento, 
    status, 
    originalValor, 
    savedAmount, 
    applySavingsCalculation 
  } = data;

  if (!categoria || !valor || !dataVencimento) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 },
    );
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
      // Directly pass the new values from the request
      applySavingsCalculation,
      originalValor,
      savedAmount,
    },
  });

  const response = {
    ...updatedExpense,
    valor: Number(updatedExpense.valor),
    originalValor: updatedExpense.originalValor
      ? Number(updatedExpense.originalValor)
      : null,
    savedAmount: updatedExpense.savedAmount
      ? Number(updatedExpense.savedAmount)
      : null,
  };

  return NextResponse.json(response);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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
