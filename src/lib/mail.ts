import { Resend } from 'resend';
import { PriceAlertEmail } from '../emails/PriceAlertEmail';
import { render } from '@react-email/components';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendPriceAlertParams {
  to: string;
  userName?: string;
  symbol: string;
  price: number;
  targetPrice: number;
  operator: 'gt' | 'lt';
}

export async function sendPriceAlertEmail({
  to,
  userName,
  symbol,
  price,
  targetPrice,
  operator,
}: SendPriceAlertParams) {
  // Verificação de segurança: se a chave não estiver definida, não tenta enviar.
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Mail] RESEND_API_KEY não definida. O envio de e-mail foi pulado.');
    return;
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    
    console.log(`[Mail] Tentando enviar e-mail para ${to} sobre ${symbol}...`);

    const emailHtml = await render(
      PriceAlertEmail({
        symbol,
        price,
        targetPrice,
        operator,
        userName,
      })
    );

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: `Alerta CriptoPlay: ${symbol} atingiu o alvo de ${targetPrice}`,
      html: emailHtml,
    });

    if (error) {
      console.error('[Mail] Erro ao enviar e-mail via Resend:', error);
      return null;
    }

    console.log(`[Mail] E-mail enviado com sucesso! ID: ${data?.id}`);
    return data;
  } catch (error) {
    console.error('[Mail] Exceção ao enviar e-mail:', error);
    return null;
  }
}
