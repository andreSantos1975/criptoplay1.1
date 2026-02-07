// src/app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';
import crypto from 'crypto'; // Importar o módulo crypto
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

export const dynamic = 'force-dynamic';

// Adicionando uma interface local para contornar o problema de tipagem do SDK
interface PaymentWithAdditionalInfo {
  additional_info?: {
    items?: {
      id?: string;
    }[];
  };
}

/// --- DEFINIÇÃO DOS LIMITES DE CHAT POR PLANO ---
/// IMPORTANTE: Substitua os IDs pelos IDs reais dos seus planos no Mercado Pago.
const PLAN_LIMITS: { [key: string]: number } = {
  "03486178e0ab4673bd1d621f9bd52de0": 200,   // ID real para o plano Starter
    "c63ef25352fe4aa1825fb04a4185d1cc": 1000,      // ID real para o plano Pro
    "543e3931dc574997b58379f19b205b2c": 7500,  // ID real para o plano Premium
    // Adicione outros planos aqui
};


// Configurar Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(req: Request) {

  // 1. Obter o corpo RAW e o cabeçalho de assinatura
  const rawBody = await req.text();
  const signature = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id');
  const url = new URL(req.url);
  const dataId = url.searchParams.get('data.id');

  if (!MERCADOPAGO_WEBHOOK_SECRET) {
    return NextResponse.json({ message: 'Erro de configuração do servidor.' }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ message: 'Requisição inválida: Cabeçalho x-signature ausente.' }, { status: 400 });
  }

  const parts = signature.split(',');
  let timestamp = '';
  let hash = '';

  for (const part of parts) {
    const [key, value] = part.trim().split('=');
    if (key === 'ts') timestamp = value;
    if (key === 'v1') hash = value;
  }

  if (!timestamp || !hash) {
    return NextResponse.json({ message: 'Requisição não autorizada: Formato de x-signature inválido.' }, { status: 401 });
  }

  const manifestParts: string[] = [];
  if (dataId) manifestParts.push(`id:${dataId}`);
  if (requestId) manifestParts.push(`request-id:${requestId}`);
  if (timestamp) manifestParts.push(`ts:${timestamp}`);
  const manifest = manifestParts.join(';') + ';';

  const secretBuffer = Buffer.from(MERCADOPAGO_WEBHOOK_SECRET!);
  const computedHash = crypto.createHmac('sha256', secretBuffer).update(manifest).digest('hex');

  if (computedHash !== hash) {
    return NextResponse.json({ message: 'Requisição não autorizada: Assinatura inválida.' }, { status: 401 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch (error) {
    return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
  }

  try {
    const { type, data } = body;

    if (type === 'subscription_preapproval') {
      const preapprovalId = data.id;
      const preapprovalInstance = new PreApproval(client);
      const preapproval = await preapprovalInstance.get({ id: preapprovalId });

      if (!preapproval || !preapproval.external_reference) {
        return NextResponse.json({ message: 'Preapproval inválida.' }, { status: 400 });
      }

      const userId = preapproval.external_reference;
      const newStatus = preapproval.status;

      const subscription = await prisma.subscription.findFirst({
        where: { mercadoPagoSubscriptionId: preapproval.id },
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: newStatus },
        });

        let userUpdateData: any = { subscriptionStatus: newStatus };

        if (newStatus === 'authorized') {
          if (subscription.planId !== null) {
            const newLimit = PLAN_LIMITS[subscription.planId];
            if (newLimit) {
              userUpdateData.chatMessageLimit = newLimit;
            }
          }
          userUpdateData.trialEndsAt = null;
        }

        await prisma.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
      }
      return NextResponse.json({ message: 'Webhook de assinatura recorrente processado.' }, { status: 200 });
    }

            if (type === 'subscription_authorized_payment') {

              const authorizedPaymentId = data.id;

              const authorizedPayment = await fetch(`https://api.mercadopago.com/authorized_payments/${authorizedPaymentId}`, {

                method: 'GET',

                headers: {

                  'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,

                  'Content-Type': 'application/json',

                },

              }).then(res => res.json());

        

              if (!authorizedPayment || !authorizedPayment.preapproval_id) {

                return NextResponse.json({ message: 'Pagamento autorizado inválido ou sem link para assinatura.' }, { status: 400 });

              }

        

              const preapprovalId = authorizedPayment.preapproval_id;

      const preapprovalInstance = new PreApproval(client);
      const preapproval = await preapprovalInstance.get({ id: preapprovalId });

      if (!preapproval || !preapproval.external_reference) {
        return NextResponse.json({ message: 'Preapproval inválida.' }, { status: 400 });
      }

      const userId = preapproval.external_reference;
      const newStatus = authorizedPayment.status;

      const subscription = await prisma.subscription.findFirst({
        where: { mercadoPagoSubscriptionId: preapprovalId },
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: newStatus === 'approved' ? 'active' : newStatus },
        });

        let userUpdateData: any = { subscriptionStatus: newStatus };

        if (newStatus === 'authorized' || newStatus === 'approved') {
          if (subscription.planId !== null) {
            const newLimit = PLAN_LIMITS[subscription.planId];
            if (newLimit) {
              userUpdateData.chatMessageLimit = newLimit;
            }
          }
          userUpdateData.trialEndsAt = null;
        }
        await prisma.user.update({
          where: { id: userId },
          data: userUpdateData,
        });
        revalidatePath('/dashboard/profile');
        revalidatePath('/');
      }
      return NextResponse.json({ message: 'Webhook de pagamento autorizado recorrente processado.' }, { status: 200 });
    }

    if (type === 'payment') {
      const paymentId = data.id;
      const paymentInstance = new Payment(client);
      const payment = await paymentInstance.get({ id: paymentId });

      if (!payment || !payment.external_reference) {
        return NextResponse.json({ message: 'Pagamento inválido.' }, { status: 400 });
      }

      if (payment.status === 'approved') {
        const userId = payment.external_reference;
        const planId = ((payment as unknown) as PaymentWithAdditionalInfo).additional_info?.items?.[0]?.id || 'LIFETIME_PLAN';

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
              subscriptionStatus: 'lifetime',
              ...(newLimit && { chatMessageLimit: newLimit })
            },
          });
        }
      }
      return NextResponse.json({ message: 'Webhook de pagamento processado.' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Tipo de notificação não relevante.' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Erro interno ao processar webhook.' }, { status: 500 });
  }
}