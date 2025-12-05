import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const cardSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  issuer: z.string().min(1, 'O emissor é obrigatório'),
  creditLimit: z.preprocess((val) => Number(String(val)), z.number().positive('O limite deve ser positivo')),
  closingDay: z.preprocess((val) => Number(String(val)), z.number().int().min(1).max(31)),
  dueDay: z.preprocess((val) => Number(String(val)), z.number().int().min(1).max(31)),
  flag: z.enum(['VISA', 'MASTERCARD', 'AMEX', 'ELO', 'HIPERCARD', 'OTHER']),
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

  const validation = cardSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.format() }, { status: 400 });
  }

  const { name, issuer, creditLimit, closingDay, dueDay, flag } = validation.data;

  try {
    const updatedCreditCard = await prisma.creditCard.updateMany({
      where: {
        id: id,
        userId: session.user.id,
      },
      data: {
        name,
        issuer,
        creditLimit,
        closingDay,
        dueDay,
        flag,
      },
    });

    if (updatedCreditCard.count === 0) {
      return NextResponse.json({ error: 'Cartão de crédito não encontrado ou você não tem permissão para editá-lo.' }, { status: 404 });
    }

    return NextResponse.json(updatedCreditCard);
  } catch (error) {
    console.error('Erro ao atualizar cartão de crédito:', error);
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
    const result = await prisma.creditCard.deleteMany({
      where: {
        id: id,
        userId: session.user.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Cartão de crédito não encontrado ou você não tem permissão para excluí-lo.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Cartão de crédito excluído com sucesso' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao excluir cartão de crédito:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
