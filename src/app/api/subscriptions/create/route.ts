// src/app/api/subscriptions/create/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { MercadoPagoConfig, PreApproval, Preference } from 'mercadopago';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  const userId = session.user.id;
  const { planId, planName, amount, description, planType, frequency } = await req.json();

  if (!planId || !planName || !amount || !description || !planType) {
    return NextResponse.json({ message: 'Dados do plano incompletos' }, { status: 400 });
  }
  
  const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user || !user.email) {
    return NextResponse.json({ message: 'Usuário não encontrado ou sem email' }, { status: 404 });
  }

  try {
    if (planType === 'LIFETIME') {
      // --- LÓGICA PARA PAGAMENTO ÚNICO (VITALÍCIO) ---
      const preference = new Preference(client);

      const preferenceData = {
        items: [
          {
            id: planId,
            title: planName,
            description: description,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: amount,
          },
        ],
        payer: {
          email: user.email,
          name: user.name,
        },
        back_urls: {
          success: `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
          failure: `${process.env.NEXTAUTH_URL}/assinatura?payment=failure`,
          pending: `${process.env.NEXTAUTH_URL}/assinatura?payment=pending`,
        },
        auto_return: 'approved',
        external_reference: userId,
        notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`,
      };

      const response = await preference.create({ body: preferenceData });

      if (response.init_point) {
        // Usando upsert para evitar múltiplas entradas pendentes para o mesmo plano
        await prisma.subscription.upsert({
          where: { 
            userId_planId: { userId, planId } // Requer um índice único composto no schema
           },
          update: {
            mercadoPagoSubscriptionId: response.id!,
            status: 'pending',
          },
          create: {
            userId: userId,
            mercadoPagoSubscriptionId: response.id!, // Usando o ID da preferência
            status: 'pending',
            planId: planId,
            planName: planName,
            amount: new Prisma.Decimal(amount),
            currency: "BRL",
            type: 'LIFETIME',
          },
        });
        
        return NextResponse.json({ init_point: response.init_point }, { status: 200 });
      } else {
        console.error('Erro ao criar preferência de pagamento:', response);
        return NextResponse.json({ message: 'Erro ao iniciar pagamento com Mercado Pago' }, { status: 500 });
      }

    } else { // Assumindo 'RECURRING'
      // --- LÓGICA EXISTENTE PARA PAGAMENTO RECORRENTE ---
      if (!frequency) {
        return NextResponse.json({ message: 'Frequência é necessária para planos recorrentes' }, { status: 400 });
      }

      const preapproval = new PreApproval(client);
      
      const preapprovalData = {
        reason: planName,
        external_reference: userId,
        payer_email: user.email,
        auto_recurring: {
          frequency: frequency,
          frequency_type: "months",
          transaction_amount: amount,
          currency_id: "BRL",
        },
        back_url: `${process.env.NEXTAUTH_URL}/dashboard?subscription=success`,
        auto_return: 'approved',
        notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/mercadopago`,
      };

      const response = await preapproval.create({ body: preapprovalData });

      if (response.init_point) {
        await prisma.subscription.create({
          data: {
            userId: userId,
            mercadoPagoSubscriptionId: String(response.id),
            status: response.status || 'pending',
            planId: planId,
            planName: planName,
            amount: new Prisma.Decimal(amount),
            currency: "BRL",
            startDate: new Date(),
            type: 'RECURRING',
          },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionStatus: response.status || 'pending' },
        });

        return NextResponse.json({ init_point: response.init_point }, { status: 200 });
      } else {
        console.error('Erro ao criar pre-aprovação:', response);
        return NextResponse.json({ message: 'Erro ao iniciar assinatura com Mercado Pago' }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Erro na API de criação de assinatura:', error);
    // Adiciona mais detalhes ao erro se for um erro do Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ message: `Falha de restrição única no campo: ${error.meta?.target}` }, { status: 409 });
      }
    }
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
}