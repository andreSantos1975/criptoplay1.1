// src/app/api/profile/update-username/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const { username } = await request.json();

  if (!username) {
    return NextResponse.json({ message: 'Apelido é obrigatório.' }, { status: 400 });
  }

  // Validações de formato e tamanho do username (as mesmas do cadastro)
  if (username.length < 3 || username.length > 20) {
    return NextResponse.json({ message: 'O apelido deve ter entre 3 e 20 caracteres.' }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return NextResponse.json({ message: 'O apelido só pode conter letras, números, hífens e underscores.' }, { status: 400 });
  }

  try {
    // Verificar unicidade do novo username, excluindo o próprio usuário atual
    const existingUserWithUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUserWithUsername && existingUserWithUsername.id !== session.user.id) {
      return NextResponse.json({ message: 'Este apelido já está em uso por outro usuário.' }, { status: 409 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { username },
      select: { username: true }, // Retorna apenas o username atualizado
    });

    return NextResponse.json({ message: 'Apelido atualizado com sucesso.', username: updatedUser.username }, { status: 200 });

  } catch (error) {
    console.error('Erro ao atualizar apelido:', error);
    return NextResponse.json({ message: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}
