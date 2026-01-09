
import { getServerSession } from "next-auth/next";
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const cardSchema = z.object({
  name: z.string().min(1, 'O nome do cartão é obrigatório.'),
  issuer: z.string().min(1, 'O emissor do cartão é obrigatório.'),
  creditLimit: z.number().positive('O limite de crédito deve ser um número positivo.'),
  closingDay: z.number().int().min(1).max(31, 'Dia de fechamento inválido.'),
  dueDay: z.number().int().min(1).max(31, 'Dia de vencimento inválido.'),
  flag: z.enum(['VISA', 'MASTERCARD', 'AMEX', 'ELO', 'HIPERCARD', 'OTHER']),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = cardSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { name, issuer, creditLimit, closingDay, dueDay, flag } = validation.data;

    const creditCard = await prisma.creditCard.create({
      data: {
        userId: session.user.id,
        name,
        issuer,
        creditLimit,
        availableCredit: creditLimit, // Saldo disponível inicial é o limite total
        closingDay,
        dueDay,
        flag,
      },
    });

    return NextResponse.json(creditCard, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cartão de crédito:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const creditCards = await prisma.creditCard.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        issuer: 'asc',
      },
    });

    return NextResponse.json(creditCards);
  } catch (error) {
    console.error('Erro ao buscar cartões de crédito:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
