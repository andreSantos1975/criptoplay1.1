// src/app/api/webhook/kiwify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Em um ambiente de produção, você DEVE implementar uma verificação robusta
// da autenticidade do webhook usando a assinatura fornecida pela Kiwify.
const verifyKiwifyWebhookSignature = (request: NextRequest) => {
  console.log("Verificando assinatura do webhook Kiwify (placeholder)...");
  return true; // Retorna true para permitir o fluxo no desenvolvimento
};

export async function POST(request: NextRequest) {
  if (!verifyKiwifyWebhookSignature(request)) {
    return NextResponse.json({ message: 'Webhook Kiwify não autorizado' }, { status: 403 });
  }

  try {
    const payload = await request.json();
    console.log('Webhook Kiwify recebido:', payload);

    // --- Adapte estes campos de acordo com a documentação da payload da Kiwify ---
    const buyerEmail = payload.Customer?.Email || payload.email;
    const productId = payload.Product?.Id || payload.product_id;
    const transactionId = payload.Sale?.TransactionId || payload.transaction_id;
    const saleStatus = payload.Sale?.Status || payload.status; // Ex: 'approved', 'paid', 'refunded'
    const price = payload.Sale?.CheckoutValue || payload.price; // Valor da compra

    // Configurações específicas para o ebook da Kiwify
    const KIWIFY_EBOOK_PRODUCT_ID = process.env.KIWIFY_EBOOK_PRODUCT_ID || 'SEU_KIWIFY_PRODUTO_ID_AQUI';
    const KIWIFY_EBOOK_PRICE = parseFloat(process.env.KIWIFY_EBOOK_PRICE || "19.90");


    if (!buyerEmail || !productId || !saleStatus) {
      console.warn('Dados essenciais do webhook Kiwify ausentes. Payload:', payload);
      return NextResponse.json({ message: 'Dados essenciais do webhook ausentes' }, { status: 400 });
    }

    const normalizedSaleStatus = saleStatus.toString().toUpperCase();

    if (normalizedSaleStatus === 'APPROVED' || normalizedSaleStatus === 'PAID') {
      if (productId.toString() === KIWIFY_EBOOK_PRODUCT_ID && parseFloat(price) >= KIWIFY_EBOOK_PRICE) {
        await prisma.ebookPurchase.upsert({
          where: {
            buyerEmail_platform: {
              buyerEmail: buyerEmail,
              platform: "KIWIFY",
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
            platform: "KIWIFY",
            productId: productId.toString(),
            price: new Prisma.Decimal(price),
            transactionId: transactionId ? transactionId.toString() : null,
            status: 'PENDING',
          },
        });
        console.log(`E-mail ${buyerEmail} qualificado para bônus (Kiwify) e salvo/atualizado.`);
      } else {
        console.log(`Webhook Kiwify ignorado: Produto ID ${productId} ou preço ${price} não corresponde ao ebook configurado.`);
      }
    } else {
      console.log(`Webhook Kiwify ignorado: Status da transação "${saleStatus}" não é de aprovação.`);
    }

    return NextResponse.json({ message: 'Webhook Kiwify processado com sucesso' }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao processar webhook Kiwify:', error);
    return NextResponse.json({ message: 'Erro interno do servidor', error: error.message }, { status: 500 });
  }
}
