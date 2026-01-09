
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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = accountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { name, bankName, balance, type } = validation.data;

    const bankAccount = await prisma.bankAccount.create({
      data: {
        userId: session.user.id,
        name,
        bankName,
        balance,
        type,
      },
    });

    return NextResponse.json(bankAccount, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conta bancária:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        bankName: 'asc',
      },
    });

    return NextResponse.json(bankAccounts);
  } catch (error) {
    console.error('Erro ao buscar contas bancárias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
