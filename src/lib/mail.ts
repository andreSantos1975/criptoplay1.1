import { Resend } from 'resend';
import { PriceAlertEmail } from '../emails/PriceAlertEmail';
import { render } from '@react-email/components';
import { ContactFormEmail } from '../emails/ContactFormEmail';

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

export async function sendVerificationEmail(email: string, token: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Mail] RESEND_API_KEY não definida. O envio de e-mail de verificação foi pulado.');
    return;
  }

  const confirmLink = `${process.env.NEXTAUTH_URL}/auth/confirm?token=${token}`;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Confirme seu email - CriptoPlay",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Bem-vindo à CriptoPlay!</h2>
          <p>Para garantir a segurança da sua conta e acesso a todos os recursos, por favor confirme seu endereço de e-mail.</p>
          <p>Clique no botão abaixo para confirmar:</p>
          <a href="${confirmLink}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">
            Confirmar E-mail
          </a>
          <p style="color: #666; font-size: 14px;">Se você não criou esta conta, pode ignorar este e-mail.</p>
        </div>
      `
    });

    if (error) {
      console.error('[Mail] Erro ao enviar e-mail de verificação:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Mail] Exceção ao enviar e-mail de verificação:', error);
    return null;
  }
}

interface ContactFormEmailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactFormEmail({ name, email, subject, message }: ContactFormEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Mail] RESEND_API_KEY não definida. O envio de e-mail de contato foi pulado.');
    // Mesmo sem a chave, não retornamos erro para não quebrar o fluxo do formulário
    return { success: false, error: 'RESEND_API_KEY not set' };
  }
  
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const toEmail = 'contato@cryptoplay.com.br'; // Destinatário fixo

  try {
    const emailHtml = await render(
      ContactFormEmail({
        name,
        email,
        subject,
        message,
      })
    );

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: `Contato CriptoPlay: ${subject}`,
      replyTo: email, // Importante para responder diretamente ao usuário
      html: emailHtml,
    });

    if (error) {
      console.error('[Mail] Erro ao enviar e-mail de contato via Resend:', error);
      return { success: false, error };
    }

    console.log(`[Mail] E-mail de contato enviado com sucesso! ID: ${data?.id}`);
    return { success: true, data };
  } catch (error) {
    console.error('[Mail] Exceção ao enviar e-mail de contato:', error);
    return { success: false, error };
  }
}
