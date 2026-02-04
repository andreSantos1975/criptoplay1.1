import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Encontrar a assinatura ativa do usuário
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: { in: ['active', 'authorized'] },
        origin: { in: ['CRIPTONET', 'MERCADOPAGO'] },
        mercadoPagoSubscriptionId: { not: null },
      },
    });

    if (!activeSubscription) {
      return NextResponse.json({ message: 'Nenhuma assinatura ativa do Mercado Pago encontrada para cancelar.' }, { status: 404 });
    }

    const mercadoPagoSubscriptionId = activeSubscription.mercadoPagoSubscriptionId;

    if (!mercadoPagoSubscriptionId) {
      return NextResponse.json({ message: 'ID de assinatura do Mercado Pago não encontrado na assinatura ativa.' }, { status: 400 });
    }

    // 2. Configurar o cliente Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
    const preApproval = new PreApproval(client);

    // 3. Chamar a API do Mercado Pago para cancelar a assinatura
    await preApproval.update({
      id: mercadoPagoSubscriptionId,
      updateRequest: {
        status: 'cancelled', // Status para cancelar a assinatura recorrente
      },
    });

    // 4. Atualizar o status da assinatura no nosso banco de dados
    await prisma.subscription.update({
      where: { id: activeSubscription.id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ message: 'Assinatura cancelada com sucesso!' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao cancelar assinatura:', error);
    // Erros do Mercado Pago podem vir em error.cause ou ter uma estrutura específica
    let errorMessage = 'Erro interno do servidor ao processar o cancelamento.';
    if (error.status && error.message) { // Erro da API do Mercado Pago
        errorMessage = `Erro do Mercado Pago: ${error.message} (Status: ${error.status})`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
