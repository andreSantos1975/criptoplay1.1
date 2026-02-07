// src/app/api/bonus/activate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { activateBonusSubscription } from '@/lib/utils';
import { sendSetPasswordEmail } from '@/lib/mail'; // Importar a função de envio de e-mail

import crypto from 'crypto'; // Para gerar o token
// import bcrypt from 'bcrypt'; // Para hash de senhas, não diretamente para tokens de reset neste contexto

export async function POST(request: NextRequest) {
  try {
    const { email, origin } = await request.json();

    if (!email || !origin) {
      return NextResponse.json({ message: 'E-mail e origem são obrigatórios.' }, { status: 400 });
    }

    // Tenta encontrar a compra de ebook qualificada
    let ebookPurchase = await prisma.ebookPurchase.findUnique({
      where: {
        buyerEmail_platform: {
          buyerEmail: email,
          platform: origin.toUpperCase(),
        },
      },
    });

    // Se o ebookPurchase não for encontrado (webhook ainda não chegou ou não foi validado)
    if (!ebookPurchase) {
        let user = await prisma.user.findUnique({
            where: { email: email },
        });

        let passwordResetToken: string | undefined;
        let passwordResetExpires: Date | undefined;

        // Gerar um novo token de reset se o usuário não existe, não tem um token, ou o token expirou
        if (!user || !user.passwordResetToken || (user.passwordResetExpires && user.passwordResetExpires < new Date())) {
            passwordResetToken = crypto.randomBytes(32).toString('hex');
            passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora de expiração
        }

        if (!user) {
            // Criar um novo usuário básico com o token de reset
            user = await prisma.user.create({
                data: {
                    email: email,
                    name: email.split('@')[0], // Nome padrão baseado no e-mail
                    subscriptionStatus: 'none',
                    passwordResetToken: passwordResetToken,
                    passwordResetExpires: passwordResetExpires,
                },
            });
            // Enviar e-mail APENAS se um novo token foi gerado e o usuário foi criado/atualizado
            if (passwordResetToken) {
                await sendSetPasswordEmail({ to: email, userName: user.name || '', token: passwordResetToken });
            }
        } else if (passwordResetToken) { // Se o usuário existe, mas o token foi gerado/atualizado
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordResetToken: passwordResetToken,
                    passwordResetExpires: passwordResetExpires,
                },
            });
            await sendSetPasswordEmail({ to: email, userName: user.name || '', token: passwordResetToken });
        }

        // Retorna mensagem de "aguardando confirmação"
        return NextResponse.json(
            { message: `Aguardando confirmação da compra do e-book na ${origin}. Seu acesso será liberado automaticamente após a validação. Um e-mail com instruções para definir sua senha foi enviado para você.`, userEmail: user?.email },
            { status: 200 }
        );
    }

    // Se a compra de ebook for encontrada, mas já foi resgatada
    if (ebookPurchase.status === 'REDEEMED') {
      return NextResponse.json(
        { message: `Este e-mail já resgatou o acesso ao plano Started via ${origin}.` },
        { status: 409 }
      );
    }

    // Se a compra de ebook for encontrada e está PENDING (pronta para ser resgatada)
    // Ativar a assinatura para o usuário
    let user = await activateBonusSubscription(email, origin);

    // Marcar a compra do e-book como resgatada e vincular ao usuário
    await prisma.ebookPurchase.update({
      where: { id: ebookPurchase.id },
      data: {
        status: 'REDEEMED',
        userId: user.id,
      },
    });

    // Se o usuário já existe e já tinha o plano ativado pelo webhook, ou se ele acabou de ativar por aqui
    // Não precisa enviar e-mail de definição de senha se já existe um válido ou se o plano já está ativo
    return NextResponse.json({ message: `Seu acesso ao plano Started foi ativado com sucesso via ${origin}!` }, { status: 200 });

  } catch (error: any) {
    console.error(`Erro ao ativar plano Started via bônus ${origin}:`, error);
    return NextResponse.json({ message: 'Erro interno do servidor', error: error.message }, { status: 500 });
  }
}