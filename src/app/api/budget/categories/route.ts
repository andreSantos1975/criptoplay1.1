import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET: Fetch all budget categories for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || typeof session.user.id !== 'string') {
    return NextResponse.json({ error: "Não autorizado ou ID de usuário inválido" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Verificação adicional para garantir que o usuário existe no banco de dados
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json({ error: "Usuário da sessão não encontrado no banco de dados." }, { status: 404 });
    }

    let categories = await prisma.budgetCategory.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        name: "asc",
      },
    });

    if (categories.length === 0) {
      // Create default categories if none exist for the user
      const defaultCategories = [
        { name: "Investimento", type: "EXPENSE", userId: userId },
        { name: "Reserva Financeira", type: "EXPENSE", userId: userId },
        { name: "Despesas", type: "EXPENSE", userId: userId },
        { name: "Lazer", type: "EXPENSE", userId: userId },
        { name: "Outros", type: "EXPENSE", userId: userId },
      ];

      await prisma.budgetCategory.createMany({
        data: defaultCategories,
        skipDuplicates: true, // In case of a race condition, prevent errors
      });

      // Fetch them again to include the newly created ones
      categories = await prisma.budgetCategory.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          name: "asc",
        },
      });
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Erro ao buscar categorias do orçamento:", error);
    // Verificar se o erro é o P2003 que estávamos vendo.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
       return NextResponse.json({ error: "Violação de chave estrangeira: o usuário pode não existir mais." }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST: Create a new budget category for the logged-in user
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Nome e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    if (type !== "INCOME" && type !== "EXPENSE") {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const newCategory = await prisma.budgetCategory.create({
      data: {
        name,
        type,
        userId: session.user.id,
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria do orçamento:", error);
    // Handle potential unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ error: "Uma categoria com este nome já existe." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
