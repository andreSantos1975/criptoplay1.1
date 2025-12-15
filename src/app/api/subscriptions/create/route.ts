// src/app/api/subscriptions/create/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  const userId = session.user.id;
  const { planId, planName, amount, frequency, description } = await req.json();

  if (!planId || !planName || !amount || !frequency || !description) {
    return NextResponse.json({ message: 'Dados do plano incompletos' }, { status: 400 });
  }

  try {
    // 1. Inicializar o cliente do Mercado Pago com a nova sintaxe
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
    const preapproval = new PreApproval(client);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user || !user.email) {
      return NextResponse.json({ message: 'Usuário não encontrado ou sem email' }, { status: 404 });
    }

    const preapprovalData = {
      reason: planName,
      external_reference: userId,
      payer_email: user.email,
      auto_recurring: {
        frequency: frequency,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "BRL",
      },
      back_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`,
      auto_return: 'approved',
    };

    const response = await preapproval.create({ body: preapprovalData });

    if (response.init_point) {
      // Salvar a assinatura no nosso banco de dados
      await prisma.subscription.create({
        data: {
          userId: userId,
          mercadoPagoSubscriptionId: String(response.id), // Garantir que seja string
          status: response.status || 'pending', // Usar 'pending' como padrão se o status for nulo
          planId: planId,
          planName: planName,
          amount: new Prisma.Decimal(amount),
          currency: "BRL",
          startDate: new Date(),
        },
      });

      // Atualizar o status de assinatura do usuário
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: response.status || 'pending' },
      });

      return NextResponse.json({ init_point: response.init_point }, { status: 200 });
    } else {
      console.error('Erro ao criar pre-aprovação:', response);
      return NextResponse.json({ message: 'Erro ao iniciar assinatura com Mercado Pago' }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro na API de criação de assinatura:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
