// src/app/api/user/me/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  isPublicProfile: z.boolean().optional(),
  image: z.string().url().optional(),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        virtualBalance: true,
        isPublicProfile: true, // Incluir o status de visibilidade do ranking
        image: true,
        // Incluir outros campos relevantes se necessário
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });

  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return NextResponse.json({ message: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Dados inválidos', errors: validation.error.format() }, { status: 400 });
    }

    const { isPublicProfile, image } = validation.data;

    // Build the data object for Prisma conditionally
    const dataToUpdate: { isPublicProfile?: boolean; image?: string } = {};
    if (isPublicProfile !== undefined) {
      dataToUpdate.isPublicProfile = isPublicProfile;
    }
    if (image !== undefined) {
      dataToUpdate.image = image;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: 'Nenhum dado para atualizar' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        isPublicProfile: true,
        image: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário:', error);
    return NextResponse.json({ message: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}
