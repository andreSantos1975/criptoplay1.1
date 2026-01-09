import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const accountSchema = z.object({
  name: z.string().min(1, 'O nome da conta é obrigatório.'),
  bankName: z.string().min(1, 'O nome do banco é obrigatório.'),
  balance: z.number().positive('O saldo inicial deve ser um número positivo.'),
  type: z.enum(['CHECKING', 'SAVINGS']),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();

  const validation = accountSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 });
  }

  const { name, bankName, balance, type } = validation.data;

  try {
    const updatedAccount = await prisma.bankAccount.updateMany({
      where: {
        id: id,
        userId: session.user.id,
      },
      data: {
        name,
        bankName,
        balance,
        type,
      },
    });

    if (updatedAccount.count === 0) {
      return NextResponse.json({ error: 'Conta não encontrada ou você não tem permissão para editá-la.' }, { status: 404 });
    }

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Erro ao atualizar conta bancária:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = params;

  try {
    const result = await prisma.bankAccount.deleteMany({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Conta não encontrada ou você não tem permissão para excluí-la.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Conta excluída com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao excluir conta bancária:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
