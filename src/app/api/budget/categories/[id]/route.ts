import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH /api/budget/categories/[id] - Update a budget category
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  try {
    const body = await request.json();
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }
    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return NextResponse.json({ error: 'Invalid category type' }, { status: 400 });
    }

    // Ensure the user is updating their own category
    const categoryToUpdate = await prisma.budgetCategory.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      }
    });

    if (!categoryToUpdate) {
      return NextResponse.json({ error: 'Category not found or you do not have permission to edit it.' }, { status: 404 });
    }

    const updatedCategory = await prisma.budgetCategory.update({
      where: {
        id: id,
      },
      data: {
        name,
        type,
      },
    });

    return NextResponse.json(updatedCategory, { status: 200 });
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/budget/categories/[id] - Delete a budget category
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  try {
    // Ensure the user is deleting their own category
    const categoryToDelete = await prisma.budgetCategory.findFirst({
        where: {
            id: id,
            userId: session.user.id,
        }
    });

    if (!categoryToDelete) {
        return NextResponse.json({ error: 'Category not found or you do not have permission to delete it.' }, { status: 404 });
    }

    // The schema is set to cascade delete, so BudgetItems will be deleted automatically.
    await prisma.budgetCategory.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Category deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
