// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import prisma from '@/lib/prisma'; // Importar prisma
import { Prisma } from '@prisma/client'; // Importar Prisma para tipos como Decimal

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para ativar a assinatura de bônus para um usuário
// Reutiliza lógica que estava em src/app/api/bonus/activate/route.ts
export async function activateBonusSubscription(userEmail: string, platform: string) {
  const BONUS_ACCESS_DAYS = 60;
  const endDate = new Date(Date.now() + BONUS_ACCESS_DAYS * 24 * 60 * 60 * 1000);

  let user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    // Se por algum motivo o usuário não existir aqui, ele será criado
    // (Embora em um cenário ideal ele já deveria existir ou ser criado no momento da tentativa de resgate)
    user = await prisma.user.create({
      data: {
        email: userEmail,
        name: userEmail.split('@')[0],
        subscriptionStatus: 'none',
      },
    });
  }

  // Atualizar User para garantir subscriptionStatus 'active'
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'active',
    },
  });

  // Verificar e atualizar/criar registro na tabela Subscription
  let subscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      planName: `Started (${platform} Bonus)`
    }
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        origin: platform.toUpperCase(),
        type: 'TIMED',
        endDate: endDate,
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
          userId: user.id,
          status: 'active',
          planName: `Started (${platform} Bonus)`,
          amount: new Prisma.Decimal(0),
          currency: 'BRL',
          type: 'TIMED',
          origin: platform.toUpperCase(),
          endDate: endDate,
      }
    });
  }

  return user; // Retorna o usuário para uso posterior, se necessário
}