import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { Resend } from 'resend';
import { render } from '@react-email/render'; // Importar a função render
import PasswordResetEmail from '@/emails/PasswordResetEmail';
import * as fs from 'fs';
import * as path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'E-mail é obrigatório.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`[RECUPERAR-SENHA] Tentativa para e-mail não cadastrado: ${email}`);
      return NextResponse.json({ message: 'Se uma conta com este e-mail existir, um link de redefinição será enviado.' }, { status: 200 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hora

    await prisma.user.update({
      where: { email },
      data: {
        passwordResetToken,
        passwordResetExpires,
      },
    });

    const resetLink = `${baseUrl}/auth/redefinir-senha?token=${resetToken}`;

    // Renderizar o componente de e-mail para HTML
    const emailHtml = await render(
      <PasswordResetEmail
        userName={user.name || 'Usuário'} // Fornecer um valor padrão caso user.name seja nulo
        resetLink={resetLink}
      />
    );

    // Anexar a imagem do logo
    const imagePath = path.join(process.cwd(), 'static/assets/hero-crypto.jpg');
    const imageBuffer = fs.readFileSync(imagePath);

    // Enviar o e-mail
    const { data, error } = await resend.emails.send({
      from: `CriptoPlay <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [email],
      subject: 'Redefina sua senha da CriptoPlay',
      html: emailHtml, // Passar o HTML gerado
      attachments: [
        {
          filename: 'hero-crypto.jpg',
          content: imageBuffer,
        },
      ],
    });

    if (error) {
      console.error('[RESEND_ERROR]', error);
      return NextResponse.json({ message: 'Erro ao enviar o e-mail de redefinição.' }, { status: 500 });
    }

    console.log(`[RECUPERAR-SENHA] E-mail de redefinição enviado para ${email}.`);

    return NextResponse.json({ message: 'Se uma conta com este e-mail existir, um link de redefinição será enviado.' }, { status: 200 });

  } catch (error) {
    console.error('[API_RECUPERAR_SENHA_ERROR]', error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}
