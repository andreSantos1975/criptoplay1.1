const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid'); // Para gerar um x-request-id único, se necessário

// Função para gerar a assinatura do webhook do Mercado Pago
function generateMercadoPagoSignature(
    secret,
    notificationId,
    xRequestId = uuidv4(), // Gera um UUID padrão se não for fornecido
    timestamp = Date.now()
) {
    if (!secret) {
        throw new Error("A chave secreta do Mercado Pago é obrigatória.");
    }
    if (!notificationId) {
        throw new Error("O ID da notificação é obrigatório.");
    }

    const ts = timestamp.toString();
    const manifest = `id:${notificationId};request-id:${xRequestId};ts:${ts};`;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const signature = hmac.digest('hex');

    return `ts=${ts},v1=${signature}`;
}

// --- Exemplo de Uso ---
// Substitua 'SUA_CHAVE_SECRETA_DO_MERCADO_PAGO' pela sua chave real de webhook.
// Você pode encontrá-la nas configurações do seu webhook no painel do Mercado Pago.
const MERCADO_PAGO_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET || 'SUA_CHAVE_SECRETA_DO_MERCADO_PAGO';

// ID da notificação do corpo do webhook de exemplo
// No exemplo fornecido pelo usuário: {"data":{"id":"123456"}}
const NOTIFICATION_ID = '123456';

// Opcional: um ID de requisição. Geralmente, o Mercado Pago envia no cabeçalho x-request-id.
// Para testes, podemos gerar um ou usar um fixo.
const X_REQUEST_ID_FOR_TEST = uuidv4(); // Gerando um novo UUID para cada execução

try {
    const xSignatureHeader = generateMercadoPagoSignature(
        MERCADO_PAGO_SECRET,
        NOTIFICATION_ID,
        X_REQUEST_ID_FOR_TEST
    );

    console.log("X-Signature gerada para o Insomnia:");
    console.log(xSignatureHeader);
    console.log("\nDados usados:");
    console.log(`  Secret Key: ${MERCADO_PAGO_SECRET}`);
    console.log(`  Notification ID: ${NOTIFICATION_ID}`);
    console.log(`  X-Request-ID (para manifest): ${X_REQUEST_ID_FOR_TEST}`);
    console.log(`  Timestamp (para manifest): ${xSignatureHeader.split(',')[0].split('=')[1]}`);
    console.log(`  Manifest: id:${NOTIFICATION_ID};request-id:${X_REQUEST_ID_FOR_TEST};ts:${xSignatureHeader.split(',')[0].split('=')[1]};`);

    // Instruções para o Insomnia:
    console.log("\n--- Instruções para o Insomnia ---");
    console.log("1. Crie uma nova requisição POST.");
    console.log("2. URL: https://geodic-wynell-sagely.ngrok-free.dev/api/webhooks/mercadopago (ou a URL do seu webhook)");
    console.log("3. Headers:");
    console.log("   - Content-Type: application/json");
    console.log(`   - X-Request-ID: ${X_REQUEST_ID_FOR_TEST} (Importante para a verificação do webhook!)`);
    console.log(`   - X-Signature: ${xSignatureHeader}`);
    console.log("4. Body (selecione Raw e JSON):");
    console.log("   Cole EXATAMENTE o JSON fornecido, garantindo que o 'id' dentro de 'data' corresponda ao 'Notification ID' usado acima.");
    console.log(`   {"action":"updated","application_id":"4448020804408138","data":{"id":"${NOTIFICATION_ID}"},"date":"2021-11-01T02:02:02Z","entity":"preapproval","id":"${NOTIFICATION_ID}","type":"subscription_preapproval","version":8}`);
    console.log("\nCertifique-se de que o 'id' no corpo do JSON (tanto o superior quanto o data.id) corresponda ao 'NOTIFICATION_ID' usado para gerar a assinatura.");

} catch (error) {
    console.error(`Erro ao gerar a assinatura: ${error.message}`);
}
