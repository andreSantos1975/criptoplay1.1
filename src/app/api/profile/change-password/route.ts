import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { message: 'A nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Se o usuário tem senha, verificar a senha atual
    if (user.password) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: 'Senha atual é obrigatória' },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);

      if (!isValid) {
        return NextResponse.json(
          { message: 'Senha atual incorreta' },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: 'Senha atualizada com sucesso' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar senha' },
      { status: 500 }
    );
  }
}
