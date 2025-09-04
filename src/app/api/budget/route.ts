import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET: Fetch the user's budget for a specific month and year, or the most recent one.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || new Date().getMonth().toString());
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

  try {
    // First, try to find the budget for the specified month and year.
    let budget = await prisma.budget.findFirst({
      where: {
        userId: session.user.id,
        month,
        year,
      },
      include: {
        categories: true,
      },
    });

    // If no budget is found for that period, find the most recent one for the user.
    if (!budget) {
      budget = await prisma.budget.findFirst({
        where: {
          userId: session.user.id,
        },
        orderBy: [
          {
            year: 'desc',
          },
          {
            month: 'desc',
          },
        ],
        include: {
          categories: true,
        },
      });
    }

    if (budget) {
      const budgetWithNumbers = {
        ...budget,
        income: budget.income.toNumber(),
        categories: budget.categories.map(cat => ({
          ...cat,
          percentage: cat.percentage.toNumber(),
        })),
      };
      return NextResponse.json(budgetWithNumbers);
    }

    return NextResponse.json(budget);
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
