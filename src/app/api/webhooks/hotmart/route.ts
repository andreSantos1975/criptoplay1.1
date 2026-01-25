
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendHotmartWelcomeEmail } from '@/lib/mail';

// A Hotmart envia os dados em um formato diferente, então precisamos de um parser específico.
async function getRawBody(req: NextRequest) {
  const body = await req.text();
  return body;
}

export async function POST(req: NextRequest) {
  console.log('[Webhook Hotmart] Recebida nova requisição.');

  const rawBody = await getRawBody(req);
  const signature = req.headers.get('x-hotmart-signature');
  const webhookSecret = process.env.HOTMART_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Webhook Hotmart] Erro: HOTMART_WEBHOOK_SECRET não está configurado.');
    return NextResponse.json({ error: 'Webhook secret não configurado no servidor.' }, { status: 500 });
  }

  if (!signature) {
    console.warn('[Webhook Hotmart] Alerta: Requisição recebida sem assinatura.');
    return NextResponse.json({ error: 'Assinatura não fornecida.' }, { status: 401 });
  }

  // --- Verificação de Assinatura ---
  const hash = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const isSignatureValid = hash === signature;

  if (!isSignatureValid) {
    console.warn('[Webhook Hotmart] Alerta: Assinatura de webhook inválida.');
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
  }
  
  console.log('[Webhook Hotmart] Assinatura verificada com sucesso.');

  // --- Processamento do Evento ---
  try {
    const event = JSON.parse(rawBody);

    if (event.event === 'purchase:approved') {
      console.log('[Webhook Hotmart] Processando evento purchase:approved.');

      const buyerEmail = event.data.buyer.email;
      const buyerName = event.data.buyer.name;
      const productName = event.data.product.name;
      const transactionId = event.data.purchase.transaction;

      if (!buyerEmail) {
        console.error('[Webhook Hotmart] Erro: Email do comprador não encontrado no payload.');
        return NextResponse.json({ error: 'Email do comprador ausente.' }, { status: 400 });
      }

      // **Lógica para distinguir usuário novo vs. existente**
      const existingUser = await prisma.user.findUnique({
        where: { email: buyerEmail },
      });

      let user;

      if (existingUser) {
        // --- Usuário Existente ---
        user = existingUser;
        console.log(`[Webhook Hotmart] Usuário existente encontrado: ${user.id}`);
        // Opcional: Futuramente, enviar um e-mail de "Novo conteúdo desbloqueado".
        // await sendContentUnlockedEmail({ to: user.email, productName });
      } else {
        // --- Usuário Novo ---
        console.log(`[Webhook Hotmart] Criando novo usuário para o e-mail: ${buyerEmail}`);
        
        // 1. Gerar token para definir a senha
        const passwordResetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expira em 24 horas

        // 2. Criar o usuário no banco com o token
        user = await prisma.user.create({
          data: {
            email: buyerEmail,
            name: buyerName,
            passwordResetToken,
            passwordResetExpires,
            // Campos padrão para novos usuários
            virtualBalance: 10000,
            chatMessageLimit: 30,
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Trial de 7 dias
          },
        });

        // 3. Enviar e-mail de boas-vindas com o link de acesso
        const accessLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${passwordResetToken}`;
        await sendHotmartWelcomeEmail({
          to: user.email!,
          userName: user.name,
          productName,
          accessLink,
        });
      }

      // 4. Criar a assinatura para o usuário (novo ou existente)
      await prisma.subscription.create({
        data: {
          userId: user.id,
          status: 'active',
          planName: `Acesso via ${productName}`,
          amount: 0,
          currency: 'BRL',
          type: 'LIFETIME',
          origin: 'HOTMART',
          planId: transactionId,
          startDate: new Date(),
        },
      });
      console.log(`[Webhook Hotmart] Assinatura '${productName}' criada para o usuário ${user.id}.`);

    } else {
      console.log(`[Webhook Hotmart] Evento '${event.event}' recebido, ignorando.`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Webhook Hotmart] Exceção ao processar o webhook:', error);
    return NextResponse.json({ error: 'Erro no processamento do webhook.' }, { status: 500 });
  }
}
