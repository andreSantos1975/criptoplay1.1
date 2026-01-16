// src/app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// --- DEFINIÇÃO DOS LIMITES DE CHAT POR PLANO ---
// IMPORTANTE: Substitua os IDs pelos IDs reais dos seus planos no Mercado Pago.
const PLAN_LIMITS: { [key: string]: number } = {
  "PLANO_STARTER_ID": 200,   // Exemplo para o plano Starter
  "PLANO_PRO_ID": 1000,      // Exemplo para o plano Pro
  "LIFETIME_PLAN": 5000,     // Exemplo para o plano Vitalício
  // Adicione outros planos aqui
};


// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook Mercado Pago recebido:', body);
    const { type, data } = body;

    // Lógica para assinaturas recorrentes
    if (type === 'preapproval') {
      const preapprovalId = data.id;
      const preapprovalInstance = new PreApproval(client);
      const preapproval = await preapprovalInstance.get({ id: preapprovalId });

      if (!preapproval || !preapproval.external_reference) {
        console.error('Webhook: Preapproval não encontrada ou sem external_reference.', preapproval);
        return NextResponse.json({ message: 'Preapproval inválida.' }, { status: 400 });
      }

      const userId = preapproval.external_reference;
      const newStatus = preapproval.status; // e.g., "authorized", "paused", "cancelled"

      const subscription = await prisma.subscription.findFirst({
        where: { mercadoPagoSubscriptionId: preapproval.id },
      });
      
      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: newStatus },
        });

        let userUpdateData: any = { subscriptionStatus: newStatus };
        
        // Se a assinatura for autorizada, atualiza o limite de chat
        if (newStatus === 'authorized') {
          const newLimit = PLAN_LIMITS[subscription.planId];
          if (newLimit) {
            userUpdateData.chatMessageLimit = newLimit;
          }
        }

        await prisma.user.update({
          where: { id: userId },
          data: userUpdateData,
        });

        console.log(`Webhook: Assinatura recorrente ${preapproval.id} do usuário ${userId} atualizada para ${newStatus}. Limite de chat definido se aplicável.`);
      }

      return NextResponse.json({ message: 'Webhook de assinatura recorrente processado.' }, { status: 200 });
    }

    // Lógica para pagamentos únicos (Plano Vitalício)
    if (type === 'payment') {
      const paymentId = data.id;
      const paymentInstance = new Payment(client);
      const payment = await paymentInstance.get({ id: paymentId });
      
      if (!payment || !payment.external_reference) {
        console.error('Webhook: Pagamento não encontrado ou sem external_reference.', payment);
        return NextResponse.json({ message: 'Pagamento inválido.' }, { status: 400 });
      }

      // Verificar se o pagamento foi aprovado
      if (payment.status === 'approved') {
        const userId = payment.external_reference;
        const planId = payment.items?.[0]?.id || 'LIFETIME_PLAN';

        const updatedSubscription = await prisma.subscription.updateMany({
          where: {
            userId: userId,
            planId: planId,
            status: 'pending',
          },
          data: {
            status: 'active',
          },
        });

        if (updatedSubscription.count > 0) {
          const newLimit = PLAN_LIMITS[planId];
          await prisma.user.update({
            where: { id: userId },
            data: { 
              subscriptionStatus: 'lifetime', // Status mais descritivo
              ...(newLimit && { chatMessageLimit: newLimit }) // Atualiza o limite se encontrado
            },
          });
          console.log(`Webhook: Plano vitalício para o usuário ${userId} ativado. Limite de chat definido como ${newLimit || 'padrão'}.`);
        } else {
          console.log(`Webhook: Nenhuma assinatura pendente encontrada para o usuário ${userId} e plano ${planId}.`);
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
