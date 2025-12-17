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
    console.log('Webhook Mercado Pago recebido:', body);
    const { type, data } = body;

    // Lógica para assinaturas recorrentes
    if (type === 'preapproval') {
      const preapprovalId = data.id;
      const preapprovalResponse = await mercadopago.preapproval.get(preapprovalId);
      const preapproval = preapprovalResponse.body;

      if (!preapproval || !preapproval.external_reference) {
        console.error('Webhook: Preapproval não encontrada ou sem external_reference.', preapproval);
        return NextResponse.json({ message: 'Preapproval inválida.' }, { status: 400 });
      }

      const userId = preapproval.external_reference;
      const newStatus = preapproval.status; // e.g., "authorized", "paused", "cancelled"

      await prisma.subscription.updateMany({
        where: { 
          userId: userId,
          mercadoPagoSubscriptionId: preapproval.id 
        },
        data: { status: newStatus },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: newStatus },
      });

      console.log(`Webhook: Assinatura recorrente ${preapproval.id} do usuário ${userId} atualizada para ${newStatus}.`);
      return NextResponse.json({ message: 'Webhook de assinatura recorrente processado.' }, { status: 200 });
    }

    // Lógica para pagamentos únicos (Plano Vitalício)
    if (type === 'payment') {
      const paymentId = data.id;
      const payment = await mercadopago.payment.findById(paymentId);
      
      if (!payment || !payment.body || !payment.body.external_reference) {
        console.error('Webhook: Pagamento não encontrado ou sem external_reference.', payment);
        return NextResponse.json({ message: 'Pagamento inválido.' }, { status: 400 });
      }

      // Verificar se o pagamento foi aprovado
      if (payment.body.status === 'approved') {
        const userId = payment.body.external_reference;
        const planId = payment.body.metadata?.plan_id || 'LIFETIME_PLAN'; // Garante compatibilidade

        // Atualiza a assinatura para ativa
        const updatedSubscription = await prisma.subscription.updateMany({
          where: {
            userId: userId,
            planId: planId,
            status: 'pending', // Apenas atualiza se estiver pendente
          },
          data: {
            status: 'active',
          },
        });

        // Se alguma assinatura foi atualizada, atualiza o usuário
        if (updatedSubscription.count > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus: 'active' },
          });
          console.log(`Webhook: Plano vitalício para o usuário ${userId} ativado com sucesso.`);
        } else {
          console.log(`Webhook: Nenhuma assinatura pendente encontrada para o usuário ${userId} e plano ${planId}. Pode já ter sido ativada.`);
        }
      }
      
      return NextResponse.json({ message: 'Webhook de pagamento processado.' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Tipo de notificação não relevante.' }, { status: 200 });

  } catch (error) {
    console.error('Erro ao processar webhook do Mercado Pago:', error);
    return NextResponse.json({ message: 'Erro interno ao processar webhook.' }, { status: 500 });
  }
}