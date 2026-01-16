import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
  }

  if (!filename || !request.body) {
    return NextResponse.json({ message: 'Requisição inválida.' }, { status: 400 });
  }

  try {
    // 1. Upload a imagem para o Vercel Blob
    const blob = await put(filename, request.body, {
      access: 'public',
      addRandomSuffix: true, // Garante nome de arquivo único
    });

    // 2. Atualiza o perfil do usuário com a nova URL da imagem
    await prisma.user.update({
      where: { id: userId },
      data: { image: blob.url },
    });

    // 3. Retorna a informação do blob para o cliente
    return NextResponse.json(blob);
    
  } catch (error: any) {
    console.error('Erro no upload do avatar:', error);
    return NextResponse.json({ message: error.message || 'Erro interno do servidor.' }, { status: 500 });
  }
}

