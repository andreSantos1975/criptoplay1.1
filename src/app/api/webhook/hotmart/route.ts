// src/app/api/webhook/hotmart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { activateBonusSubscription } from '@/lib/utils'; // Importar a função utilitária

// Função auxiliar para verificar a autenticidade do webhook (exemplo)
// Em um ambiente de produção, você DEVE implementar uma verificação robusta
// usando a assinatura do webhook fornecida pela Hotmart para garantir que a requisição
// realmente veio da Hotmart e não foi adulterada.
const verifyWebhookSignature = (request: NextRequest) => {
  // Exemplo: Hotmart pode enviar um header X-Hotmart-Signature ou algo similar.
  // Você precisaria de uma chave secreta fornecida pela Hotmart.
  // const signature = request.headers.get('X-Hotmart-Signature');
  // const secret = process.env.HOTMART_WEBHOOK_SECRET;
  // ... lógica de verificação ...

  // Por enquanto, apenas um placeholder.
  console.log("Verificando assinatura do webhook (placeholder)...");
  return true; // Retorna true para permitir o fluxo no desenvolvimento
};

export async function POST(request: NextRequest) {
  // 1. Verificar a autenticidade do webhook (MUITO IMPORTANTE EM PRODUÇÃO)
  if (!verifyWebhookSignature(request)) {
    return NextResponse.json({ message: 'Webhook não autorizado' }, { status: 403 });
  }

  try {
    const payload = await request.json();
    console.log('Webhook Hotmart recebido:', payload);

    // Adapte estes campos de acordo com a documentação da payload da Hotmart
    const buyerEmail = payload.data?.buyer?.email || payload.email || payload.buyerEmail;
    const productId = payload.data?.product?.id || payload.prod || payload.product_id;
    const transactionId = payload.data?.transaction?.id || payload.transaction || payload.id;
    const saleStatus = payload.data?.status || payload.status; // 'approved', 'complete', 'APROVADO' etc.
    const price = payload.data?.price?.value || payload.price; // Valor da compra

    // ID do produto do ebook de R$19,90 na Hotmart
    // Este valor deve ser configurado em suas variáveis de ambiente ou de forma segura.
    const HOTMART_EBOOK_PRODUCT_ID = process.env.HOTMART_EBOOK_PRODUCT_ID || 'SEU_PRODUTO_ID_AQUI'; // Substitua pelo ID real
    const HOTMART_EBOOK_PRICE = parseFloat(process.env.HOTMART_EBOOK_PRICE || "19.90");


    if (!buyerEmail || !productId || !saleStatus) {
      console.warn('Dados essenciais do webhook ausentes. Payload:', payload);
      return NextResponse.json({ message: 'Dados essenciais do webhook ausentes' }, { status: 400 });
    }

    // Apenas processar vendas aprovadas ou completas do produto específico
    const normalizedSaleStatus = saleStatus.toString().toUpperCase();

    if (normalizedSaleStatus === 'APPROVED' || normalizedSaleStatus === 'COMPLETE' || normalizedSaleStatus === 'APROVADO') {
      if (productId.toString() === HOTMART_EBOOK_PRODUCT_ID && parseFloat(price) >= HOTMART_EBOOK_PRICE) {
        // Encontra ou cria o registro da compra do ebook
        const ebookPurchase = await prisma.ebookPurchase.upsert({
          where: {
            buyerEmail_platform: {
              buyerEmail: buyerEmail,
              platform: "HOTMART",
            },
          },
          update: {
            // status: 'PENDING', // O status pode ser atualizado para REDEEMED aqui ou após a ativação
            productId: productId.toString(),
            price: new Prisma.Decimal(price),
            transactionId: transactionId ? transactionId.toString() : null,
          },
          create: {
            buyerEmail: buyerEmail,
            platform: "HOTMART",
            productId: productId.toString(),
            price: new Prisma.Decimal(price),
            transactionId: transactionId ? transactionId.toString() : null,
            status: 'PENDING', // Inicialmente PENDING
          },
        });
        console.log(`E-mail ${buyerEmail} qualificado para bônus (Hotmart) e salvo/atualizado.`);

        // Verificar se o usuário já existe e se tentou resgatar
        let user = await prisma.user.findUnique({
            where: { email: buyerEmail },
        });

        // Se o usuário existir e a compra estiver PENDING (e não REDEEMED ainda por webhook anterior)
        if (user && ebookPurchase.status === 'PENDING') {
            // Ativar a assinatura para o usuário
            await activateBonusSubscription(buyerEmail, "HOTMART");

            // Marcar a compra do e-book como resgatada e vincular ao usuário
            await prisma.ebookPurchase.update({
                where: { id: ebookPurchase.id },
                data: {
                    status: 'REDEEMED',
                    userId: user.id,
                },
            });
            console.log(`Assinatura Started ativada automaticamente para ${buyerEmail} via webhook Hotmart.`);
        }

      } else {
        console.log(`Webhook Hotmart ignorado: Produto ID ${productId} ou preço ${price} não corresponde ao ebook configurado (${HOTMART_EBOOK_PRODUCT_ID}, ${HOTMART_EBOOK_PRICE}).`);
      }
    } else {
        console.log(`Webhook Hotmart ignorado: Status da venda "${saleStatus}" não é de aprovação.`);
    }

    return NextResponse.json({ message: 'Webhook Hotmart processado com sucesso' }, { status: 200 });

  } catch (error: any) {
    console.error('Erro ao processar webhook Hotmart:', error);
    return NextResponse.json({ message: 'Erro interno do servidor', error: error.message }, { status: 500 });
  }
}
