
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');

  const queryYear = year ? parseInt(year) : new Date().getFullYear();

  const budget = await prisma.budget.findUnique({
    where: {
      userId_year: {
        userId: session.user.id,
        year: queryYear,
      },
    },
    include: {
      items: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!budget) {
    // If no budget is found for the year, return a default structure or empty array
    return NextResponse.json({
        year: queryYear,
        items: [],
        income: [],
        expense: [],
      });
  }

  const budgetItems = budget.items.map(item => ({
    ...item,
    amount: Number(item.amount),
    category: {
        ...item.category,
        name: item.category.name,
    }
  }));

  const incomeItems = budgetItems.filter(item => item.category.type === 'INCOME');
  const expenseItems = budgetItems.filter(item => item.category.type === 'EXPENSE');

  return NextResponse.json({
    id: budget.id,
    year: budget.year,
    items: budgetItems,
    income: incomeItems,
    expense: expenseItems,
  });
}
