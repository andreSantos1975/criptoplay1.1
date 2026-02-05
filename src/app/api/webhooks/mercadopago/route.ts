// src/app/api/webhooks/mercadopago/route.ts
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';
import crypto from 'crypto'; // Importar o módulo crypto
import prisma from '@/lib/prisma';

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

  // 1. Obter o corpo RAW e o cabeçalho de assinatura
  const rawBody = await req.text();
    const signature = req.headers.get('x-signature');
    const requestId = req.headers.get('x-request-id'); // Novo: Capturar x-request-id
    const url = new URL(req.url);
    const dataId = url.searchParams.get('data.id'); // Novo: Capturar data.id da query string
  
    console.log('--- DEBUG WEBHOOK ---');
    console.log('Raw Body Recebido:', rawBody);
    console.log('X-Signature Recebido:', signature);
    console.log('X-Request-Id Recebido:', requestId); // Novo log para debug
    console.log('Data.Id da Query:', dataId); // Novo log para debug
  
    // 2. Verificar se o segredo e a assinatura estão presentes
    if (!MERCADOPAGO_WEBHOOK_SECRET) {
      console.error('MERCADOPAGO_WEBHOOK_SECRET não configurado.');
      return NextResponse.json({ message: 'Erro de configuração do servidor.' }, { status: 500 });
    }
  
    // 2. Extrair ts e v1 do x-signature
    if (!signature) {
      console.warn('Webhook: Cabeçalho x-signature ausente.');
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
      console.warn('Webhook: Formato de x-signature inválido.');
      return NextResponse.json({ message: 'Requisição não autorizada: Formato de x-signature inválido.' }, { status: 401 });
    }
  
    // 3. Construir a manifest (ignorar partes ausentes)
    const manifestParts: string[] = [];
    if (dataId) manifestParts.push(`id:${dataId}`);
    if (requestId) manifestParts.push(`request-id:${requestId}`);
    if (timestamp) manifestParts.push(`ts:${timestamp}`);
    const manifest = manifestParts.join(';') + ';'; // Termina com ';'
  
    // 4. Computar o HMAC-SHA256
    const secretBuffer = Buffer.from(MERCADOPAGO_WEBHOOK_SECRET!);
    const computedHash = crypto.createHmac('sha256', secretBuffer).update(manifest).digest('hex');
  
    // Logs de debug atualizados
    console.log('DEBUG: MERCADOPAGO_WEBHOOK_SECRET (value):', MERCADOPAGO_WEBHOOK_SECRET);
    console.log('DEBUG: timestamp:', timestamp);
    console.log('DEBUG: manifest:', manifest);
    console.log('DEBUG: Hash Recebido (v1):', hash);
    console.log('DEBUG: Hash Calculado:', computedHash);
  
    if (computedHash !== hash) {
      console.warn('Webhook: Assinatura inválida.');
      return NextResponse.json({ message: 'Requisição não autorizada: Assinatura inválida.' }, { status: 401 });
    }
  
    // Se a verificação passou, parsear o corpo como JSON
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log('Corpo JSON Processado:', body);
    } catch (error) {
      console.error('Erro ao parsear rawBody como JSON:', error);
      // Adicione um log para o rawBody aqui se ainda não tiver, para ver se é vazio ou inválido
      console.error('Raw Body que falhou no parse:', rawBody);
      return NextResponse.json({ message: 'Corpo da requisição inválido.' }, { status: 400 });
    }  


  // BLOC
  try {
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
          if (subscription.planId !== null) { // Adicionando a verificação de nulidade aqui
            const newLimit = PLAN_LIMITS[subscription.planId];
            if (newLimit) {
              userUpdateData.chatMessageLimit = newLimit;
            }
          } else {
            console.warn(`Webhook: assinatura ${subscription.id} tem planId nulo. Limite de chat não atualizado.`);
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
  } // FIM DO BLOCO COMENTADO

}
