// src/app/api/webhook/perfectpay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Em um ambiente de produção, você DEVE implementar uma verificação robusta
// da autenticidade do webhook usando a assinatura fornecida pela Perfect Pay.
const verifyPerfectPayWebhookSignature = (request: NextRequest) => {
  console.log("Verificando assinatura do webhook Perfect Pay (placeholder)...");
  return true; // Retorna true para permitir o fluxo no desenvolvimento
};

export async function POST(request: NextRequest) {
  if (!verifyPerfectPayWebhookSignature(request)) {
    return NextResponse.json({ message: 'Webhook Perfect Pay não autorizado' }, { status: 403 });
  }

  try {
    const payload = await request.json();
    console.log('Webhook Perfect Pay recebido:', payload);

    // --- Adapte estes campos de acordo com a documentação da payload da Perfect Pay ---
    const buyerEmail = payload.email_comprador || payload.customer?.email;
    const productId = payload.produto_id || payload.product?.id;
    const transactionId = payload.id_transacao || payload.transaction_id;
    const saleStatus = payload.status_transacao || payload.status; // Ex: 'approved', 'paid', 'complete'
    const price = payload.valor_total || payload.amount; // Valor da compra

    // Configurações específicas para o ebook da Perfect Pay
    const PERFECTPAY_EBOOK_PRODUCT_ID = process.env.PERFECTPAY_EBOOK_PRODUCT_ID || 'SEU_PP_PRODUTO_ID_AQUI';
    const PERFECTPAY_EBOOK_PRICE = parseFloat(process.env.PERFECTPAY_EBOOK_PRICE || "19.90");

    if (!buyerEmail || !productId || !saleStatus) {
      console.warn('Dados essenciais do webhook Perfect Pay ausentes. Payload:', payload);
      return NextResponse.json({ message: 'Dados essenciais do webhook ausentes' }, { status: 400 });
    }

    const normalizedSaleStatus = saleStatus.toString().toUpperCase();

    if (normalizedSaleStatus === 'APPROVED' || normalizedSaleStatus === 'PAID' || normalizedSaleStatus === 'COMPLETED') {
      if (productId.toString() === PERFECTPAY_EBOOK_PRODUCT_ID && parseFloat(price) >= PERFECTPAY_EBOOK_PRICE) {
        await prisma.ebookPurchase.upsert({
          where: {
            buyerEmail_platform: {
              buyerEmail: buyerEmail,
              platform: "PERFECTPAY",
            },
          },
          update: {
            status: 'PENDING',
            productId: productId.toString(),
            price: new Prisma.Decimal(price),
            transactionId: transactionId ? transactionId.toString() : null,
          },
          create: {
            buyerEmail: buyerEmail,
            platform: "PERFECTPAY",
            productId: productId.toString(),
            price: new Prisma.Decimal(price),
            transactionId: transactionId ? transactionId.toString() : null,
            status: 'PENDING',
          },
        });
        console.log(`E-mail ${buyerEmail} qualificado para bônus (Perfect Pay) e salvo/atualizado.`);
      } else {
        console.log(`Webhook Perfect Pay ignorado: Produto ID ${productId} ou preço ${price} não corresponde ao ebook configurado.`);
      }
    } else {
      console.log(`Webhook Perfect Pay ignorado: Status da transação "${saleStatus}" não é de aprovação.`);
    }

    return NextResponse.json({ message: 'Webhook Perfect Pay processado com sucesso' }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao processar webhook Perfect Pay:', error);
    return NextResponse.json({ message: 'Erro interno do servidor', error: error.message }, { status: 500 });
  }
}
