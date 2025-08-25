import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const id = (await params).id;

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

  if (originalValor !== null && originalValor !== undefined) {
    updateData.originalValor = originalValor;
    // Calculate saved amount regardless of status
    updateData.savedAmount = originalValor - valor;
  } else {
    // If originalValor is not provided or null, ensure savedAmount is also null
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
  request: Request,
  { params }: { params: { id:string } },
) {
  const session = await getServerSession(authOptions);
  const id = (await params).id;

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
