// src/app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import mercadopago from 'mercadopago';
import prisma from '@/lib/prisma';

// Configurar Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;

    // Apenas processar eventos de preapproval
    if (type !== 'preapproval') {
      return NextResponse.json({ message: 'Tipo de notificação não suportado.' }, { status: 200 });
    }

    const preapprovalId = data.id;

    // Buscar detalhes da preapproval no Mercado Pago para validação
    const preapprovalResponse = await mercadopago.preapproval.get(preapprovalId);
    const preapproval = preapprovalResponse.body;

    // Verificar se a preapproval existe e se tem um external_reference (userId)
    if (!preapproval || !preapproval.external_reference) {
      console.error('Webhook: Preapproval não encontrada ou sem external_reference.', preapproval);
      return NextResponse.json({ message: 'Preapproval inválida ou sem referência de usuário.' }, { status: 400 });
    }

    const userId = preapproval.external_reference;
    const newStatus = preapproval.status; // e.g., "authorized", "pending", "cancelled"

    // Atualizar a assinatura no banco de dados
    const updatedSubscription = await prisma.subscription.update({
      where: { mercadoPagoSubscriptionId: preapproval.id },
      data: { status: newStatus },
    });

    // Atualizar o status de assinatura do usuário
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: newStatus },
    });

    console.log(`Webhook: Assinatura ${preapproval.id} para o usuário ${userId} atualizada para ${newStatus}.`);
    return NextResponse.json({ message: 'Webhook recebido e processado com sucesso.' }, { status: 200 });

  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    return NextResponse.json({ message: 'Erro interno ao processar webhook.' }, { status: 500 });
  }
}