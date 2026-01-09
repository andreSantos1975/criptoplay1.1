import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Fetch all budget items for a given year
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || "");

  if (isNaN(year)) {
    return NextResponse.json(
      { error: "O ano é obrigatório" },
      { status: 400 }
    );
  }

  try {
    // Find the budget for the user and year
    const budget = await prisma.budget.findUnique({
      where: {
        userId_year: {
          userId: session.user.id,
          year: year,
        },
      },
      include: {
        items: true,
      },
    });

    // If a budget is found, return its items. Otherwise, return an empty array.
    return NextResponse.json(budget?.items || []);
  } catch (error) {
    console.error("Erro ao buscar itens do orçamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST: Create or update a budget item
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { year, month, categoryId, amount } = body;

    if (!year || !month || !categoryId || amount === undefined) {
      return NextResponse.json(
        { error: "Dados incompletos para salvar o item" },
        { status: 400 }
      );
    }

    // Find or create the budget for the given year
    const budget = await prisma.budget.upsert({
      where: {
        userId_year: {
          userId: session.user.id,
          year: year,
        },
      },
      update: {},
      create: {
        year: year,
        userId: session.user.id,
      },
    });

    // Upsert the budget item
    const budgetItem = await prisma.budgetItem.upsert({
      where: {
        budgetId_categoryId_month: {
          budgetId: budget.id,
          categoryId: categoryId,
          month: month,
        },
      },
      update: {
        amount: amount,
      },
      create: {
        budgetId: budget.id,
        categoryId: categoryId,
        month: month,
        amount: amount,
      },
    });

    return NextResponse.json(budgetItem, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar item do orçamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}