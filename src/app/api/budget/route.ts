import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetDate = new Date();
  const year = parseInt(searchParams.get('year') || targetDate.getFullYear().toString());
  const month = parseInt(searchParams.get('month') || (targetDate.getMonth() + 1).toString());

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // 1. Find the budget for the specified month and year.
    const budget = await prisma.budget.findFirst({
      where: {
        userId: session.user.id,
        month,
        year,
      },
      include: {
        categories: true,
      },
    });

    // If no budget is set for the selected period, return null.
    if (!budget) {
      return NextResponse.json(null);
    }

    // 2. Find all expenses for the same period.
    const expenses = await prisma.expense.findMany({
      where: {
        userId: session.user.id,
        dataVencimento: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // 3. Calculate actual spending per category.
    const actualSpendingByCategory = expenses.reduce((acc, expense) => {
      const category = expense.categoria;
      const amount = expense.valor;
      if (!acc[category]) {
        acc[category] = new Decimal(0);
      }
      acc[category] = acc[category].add(amount);
      return acc;
    }, {} as Record<string, Decimal>);

    // 4. Combine budget data with actual spending.
    const categoriesWithActual = budget.categories.map(cat => {
      const actual = actualSpendingByCategory[cat.name] || new Decimal(0);
      return {
        ...cat,
        percentage: cat.percentage.toNumber(),
        plannedAmount: (budget.income.toNumber() * cat.percentage.toNumber()) / 100,
        actualSpending: actual.toNumber(),
      };
    });

    const response = {
      ...budget,
      income: budget.income.toNumber(),
      categories: categoriesWithActual,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// POST: Create or update a user's budget
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { income, categories, month, year } = body;

    if (!income || !categories || !month || !year) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const budgetData = {
      userId: session.user.id,
      income,
      month,
      year,
    };

    const savedBudget = await prisma.budget.upsert({
      where: {
        userId_year_month: {
          userId: session.user.id,
          year,
          month,
        },
      },
      update: budgetData,
      create: budgetData,
    });

    // Delete old categories and create new ones
    await prisma.budgetCategory.deleteMany({
      where: {
        budgetId: savedBudget.id,
      },
    });

    const createdCategories = await prisma.budgetCategory.createMany({
      data: categories.map((cat: { name: string; percentage: number }) => ({
        budgetId: savedBudget.id,
        name: cat.name,
        percentage: cat.percentage,
      })),
    });

    return NextResponse.json({ ...savedBudget, categories: createdCategories });
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
