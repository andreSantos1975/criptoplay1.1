
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { generateVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/mail'
import { addDays } from 'date-fns' // Importar addDays

export const dynamic = 'force-dynamic';

// Função para gerar um username único
async function generateUniqueUsername(): Promise<string> {
  let uniqueUsername = '';
  let isUnique = false;
  while (!isUnique) {
    const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
    uniqueUsername = `Trader-${randomNumber}`;
    const existingUser = await prisma.user.findUnique({
      where: { username: uniqueUsername },
    });
    if (!existingUser) {
      isUnique = true;
    }
  }
  return uniqueUsername;
}

export async function POST(request: Request) {
  try {
    // Extrai a URL para ler os parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const origem = searchParams.get('origem');

    const { name, email, password, username } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Todos os campos obrigatórios (nome, email, senha) devem ser preenchidos.' }, { status: 400 });
    }

    // Validar formato e tamanho do username se fornecido
    if (username) {
      if (username.length < 3 || username.length > 20) {
        return NextResponse.json({ message: 'O apelido deve ter entre 3 e 20 caracteres.' }, { status: 400 });
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return NextResponse.json({ message: 'O apelido só pode conter letras, números, hífens e underscores.' }, { status: 400 });
      }
    }

    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json({ message: 'Este e-mail já está em uso.' }, { status: 409 });
    }

    let finalUsername = username;
    if (finalUsername) {
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username: finalUsername },
      });
      if (existingUserByUsername) {
        return NextResponse.json({ message: 'Este apelido já está em uso.' }, { status: 409 });
      }
    } else {
      finalUsername = await generateUniqueUsername();
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Define a duração do trial com base na origem
    const trialDuration = origem === 'hotmart' ? 30 : 7;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username: finalUsername,
        trialEndsAt: addDays(new Date(), trialDuration), // Usa a duração do trial definida
      },
    });

    // Gerar token de verificação e enviar e-mail
    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(email, verificationToken.token);

    return NextResponse.json({ message: 'Usuário criado com sucesso!', user }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ message: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}
