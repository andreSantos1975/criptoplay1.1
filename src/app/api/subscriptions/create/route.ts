// src/app/api/subscriptions/create/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { MercadoPagoConfig, PreApproval, Preference } from 'mercadopago';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  const userId = session.user.id;
  // Agora recebe 'payerEmail' diretamente do corpo da requisição
  const { planId, planName, amount, description, planType, frequency, payerEmail, cpf } = await req.json();

  console.log('Recebido do Frontend:', { planId, planName, amount, planType, frequency, payerEmail, cpf });

  /// Adiciona validação para o payerEmail
  if (!planId || !planName || !amount || !description || !planType || !payerEmail) {
    return NextResponse.json({ message: 'Dados do plano ou e-mail do pagador incompletos' }, { status: 400 });
  }
  
  const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
  }

  try {
    if (planType === 'LIFETIME') {
      // --- LÓGICA PARA PAGAMENTO ÚNICO (VITALÍCIO) ---
      // Lógica de pagamento único (Preference) continua a mesma, mas poderia ser adaptada para CPF se necessário.
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
          email: payerEmail,
          name: user.name ?? undefined,
          ...(cpf && { identification: { type: 'CPF', number: cpf } }), // Adiciona CPF se fornecido
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

      if (response.id && response.init_point) {
        // Lógica de "upsert manual" para evitar múltiplas entradas pendentes
        const existingPendingSub = await prisma.subscription.findFirst({
          where: {
            userId: userId,
            planId: planId,
            status: 'pending',
          },
        });

        if (existingPendingSub) {
          await prisma.subscription.update({
            where: { id: existingPendingSub.id },
            data: { mercadoPagoSubscriptionId: response.id },
          });
        } else {
          await prisma.subscription.create({
            data: {
              userId: userId,
              mercadoPagoSubscriptionId: response.id,
              status: 'pending',
              planId: planId,
              planName: planName,
              amount: new Prisma.Decimal(amount),
              currency: "BRL",
              type: 'LIFETIME',
            },
          });
        }
        
        return NextResponse.json({ preferenceId: response.id }, { status: 200 });
      } else {
        console.error('Erro ao criar preferência de pagamento:', response);
        return NextResponse.json({ message: 'Erro ao iniciar pagamento com Mercado Pago' }, { status: 500 });
      }

    } else { // Assumindo 'RECURRING'
      // --- LÓGICA PARA PAGAMENTO RECORRENTE COM CPF ---
      if (!frequency) {
        return NextResponse.json({ message: 'Frequência é necessária para planos recorrentes' }, { status: 400 });
      }
      if (!cpf) {
        return NextResponse.json({ message: 'CPF é obrigatório para assinaturas recorrentes' }, { status: 400 });
      }

      const preapproval = new PreApproval(client);
      
      const preapprovalData = {
        reason: planName,
        payer_email: payerEmail, // Adicionado de volta
        payer: {
          identification: {
            type: "CPF",
            number: cpf,
          },
        },
        external_reference: userId,
        back_url: `${process.env.NEXTAUTH_URL}/assinatura?subscription=processed`,
        auto_recurring: {
          frequency: Number(frequency),
          frequency_type: "months",
          transaction_amount: Number(amount.toFixed(2)),
          currency_id: "BRL",
        },
      };

      console.log('📦 Enviando para o Mercado Pago (PreApproval):', JSON.stringify(preapprovalData, null, 2));

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

        return NextResponse.json({ init_point: response.init_point }, { status: 200 });
      } else {
        console.error('Erro ao criar pre-aprovação:', response);
        return NextResponse.json({ message: 'Erro ao iniciar assinatura com Mercado Pago' }, { status: 500 });
      }
    }

  } catch (error: any) {
    console.error('❌ ERRO CRÍTICO na API de criação de assinatura:');
    console.error('Mercado Pago Error Details:', {
      status: error?.status || error?.response?.status,
      message: error?.message,
      cause: error?.cause ? JSON.stringify(error.cause) : 'undefined',
      data: error?.response?.data ? JSON.stringify(error.response.data) : 'undefined',
      fullError: JSON.stringify(error, null, 2)
    });
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ message: `Falha de restrição única no campo: ${error.meta?.target}` }, { status: 409 });
      }
    }
    
    const errorMessage = error?.response?.data?.message || error.message || 'Erro interno do servidor';
    const errorStatus = error?.status || 500;
    return NextResponse.json({ message: errorMessage }, { status: errorStatus });
  }
}