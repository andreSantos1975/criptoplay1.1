// src/app/api/bonus/activate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { email, origin } = await request.json(); // Recebe também a origem

    if (!email || !origin) {
      return NextResponse.json({ message: 'E-mail e origem são obrigatórios.' }, { status: 400 });
    }

    // 1. Verificar se o e-mail está na lista de compras qualificadas para a plataforma específica e não foi resgatado
    const ebookPurchase = await prisma.ebookPurchase.findUnique({ // Usa o novo modelo EbookPurchase
      where: {
        buyerEmail_platform: { // Chave única composta
          buyerEmail: email,
          platform: origin.toUpperCase(), // Garante que a plataforma esteja em maiúsculas
        },
      },
    });

    if (!ebookPurchase) {
      return NextResponse.json(
        { message: `E-mail não encontrado na lista de compradores qualificados do e-book para a plataforma ${origin}.` },
        { status: 404 }
      );
    }

    if (ebookPurchase.status === 'REDEEMED') {
      return NextResponse.json(
        { message: `Este e-mail já resgatou o acesso ao plano Started via ${origin}.` },
        { status: 409 } // Conflict
      );
    }

    // Define a duração do acesso de bônus (ex: 60 dias)
    const BONUS_ACCESS_DAYS = 60;
    const endDate = new Date(Date.now() + BONUS_ACCESS_DAYS * 24 * 60 * 60 * 1000);


    // 2. Conceder acesso ao plano Started (criar ou atualizar usuário e assinatura)
    let user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (user) {
      // Usuário existente: atualizar status de assinatura
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'active',
        },
      });

      let subscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          planName: `Started (${origin} Bonus)` // Nome do plano dinâmico
        }
      });

      if (subscription) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'active',
            origin: origin.toUpperCase(),
            type: 'TIMED', // Alterado para TIMED
            endDate: endDate, // Adicionado endDate
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
              userId: user.id,
              status: 'active',
              planName: `Started (${origin} Bonus)`, // Nome do plano dinâmico
              amount: new Prisma.Decimal(0), // Gratuito
              currency: 'BRL',
              type: 'TIMED', // Alterado para TIMED
              origin: origin.toUpperCase(),
              endDate: endDate, // Adicionado endDate
          }
        });
      }

    } else {
      // Novo usuário: criar usuário e atribuir assinatura
      user = await prisma.user.create({
        data: {
          email: email,
          name: email.split('@')[0], // Nome padrão baseado no e-mail
          subscriptionStatus: 'active',
          // Outras informações de usuário padrão, como virtualBalance padrão
        },
      });

      await prisma.subscription.create({
        data: {
            userId: user.id,
            status: 'active',
            planName: `Started (${origin} Bonus)`, // Nome do plano dinâmico
            amount: new Prisma.Decimal(0), // Gratuito
            currency: 'BRL',
            type: 'TIMED', // Alterado para TIMED
            origin: origin.toUpperCase(),
            endDate: endDate, // Adicionado endDate
        }
      });
    }

    // 3. Marcar a compra do e-book como resgatada
    await prisma.ebookPurchase.update({ // Usa o novo modelo EbookPurchase
      where: { id: ebookPurchase.id },
      data: { status: 'REDEEMED' },
    });

    return NextResponse.json({ message: `Seu acesso ao plano Started foi ativado com sucesso via ${origin}!` }, { status: 200 });
  } catch (error: any) {
    console.error(`Erro ao ativar plano Started via bônus ${origin}:`, error);
    return NextResponse.json({ message: 'Erro interno do servidor', error: error.message }, { status: 500 });
  }
}
