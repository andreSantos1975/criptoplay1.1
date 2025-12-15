// src/app/api/subscriptions/create/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import mercadopago from 'mercadopago';

// Configurar Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

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
    // 1. Criar ou verificar o plano de pre-aprovação no Mercado Pago
    // Para simplificar, vamos assumir que o planId é uma representação interna
    // e criaremos ou buscaremos o plano do Mercado Pago com base nele.
    // Em um cenário real, você buscaria o plan_id do MP que corresponde ao seu planId interno.

    // Neste exemplo, vamos criar uma nova pre-aprovação para cada usuário,
    // o que é mais comum para assinaturas avulsas onde o usuário inicia o processo.
    // Se você tiver planos fixos e quiser que o MP gerencie o plano recorrente,
    // você criaria um 'preapproval_plan' uma única vez e referenciaria ele aqui.

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user || !user.email) {
      return NextResponse.json({ message: 'Usuário não encontrado ou sem email' }, { status: 404 });
    }

    const preapprovalData = {
      reason: planName, // Nome ou descrição do plano
      external_reference: userId, // ID do usuário para referência externa
      payer_email: user.email,
      auto_recurring: {
        frequency: frequency, // Ex: 1 (mensal)
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "BRL",
      },
      back_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`, // URL de retorno após o pagamento
      // notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`, // Será configurado depois
    };

    const response = await mercadopago.preapproval.create(preapprovalData);
    const preapproval = response.body;

    if (preapproval.init_point) {
      // Salvar a assinatura no nosso banco de dados
      await prisma.subscription.create({
        data: {
          userId: userId,
          mercadoPagoSubscriptionId: preapproval.id,
          status: preapproval.status, // pending, authorized, etc.
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
        data: { subscriptionStatus: preapproval.status },
      });

      return NextResponse.json({ init_point: preapproval.init_point }, { status: 200 });
    } else {
      console.error('Erro ao criar pre-aprovação:', preapproval);
      return NextResponse.json({ message: 'Erro ao iniciar assinatura com Mercado Pago' }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro na API de criação de assinatura:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}
