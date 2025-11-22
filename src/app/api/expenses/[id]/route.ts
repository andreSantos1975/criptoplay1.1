import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
  const { categoria, valor, dataVencimento, status, originalValor } = data;

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    categoria,
    valor,
    dataVencimento: new Date(dataVencimento),
    status,
  };

  // Only update economy-related fields if originalValor is explicitly provided.
  // This prevents accidental erasure of savedAmount when just changing the status.
  if (originalValor !== null && originalValor !== undefined) {
    updateData.originalValor = originalValor;
    updateData.savedAmount = originalValor - valor;
  } else if (data.hasOwnProperty('originalValor') && originalValor === null) {
    // If the frontend explicitly sends originalValor as null, it means the user wants to remove the economy calculation.
    updateData.originalValor = null;
    updateData.savedAmount = null;
  }

  const updatedExpense = await prisma.expense.update({
    where: { id },
    data: updateData,
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
