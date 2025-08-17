
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// GET /api/capital-movements - Fetch all capital movements for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const movements = await prisma.capitalMovement.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: 'asc',
      },
    });
    return NextResponse.json(movements);
  } catch (error) {
    console.error('Error fetching capital movements:', error);
    return NextResponse.json({ error: 'Failed to fetch capital movements' }, { status: 500 });
  }
}

// POST /api/capital-movements - Create a new capital movement
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, type, date, description } = body;

    // Basic validation
    if (amount == null || !type) {
        return NextResponse.json({ error: 'Amount and type are required' }, { status: 400 });
    }
    if (type !== 'DEPOSIT' && type !== 'WITHDRAWAL') {
        return NextResponse.json({ error: 'Invalid movement type' }, { status: 400 });
    }

    const newMovement = await prisma.capitalMovement.create({
      data: {
        userId: session.user.id,
        amount: new Decimal(amount),
        type: type,
        date: date ? new Date(date) : new Date(),
        description: description || null,
      },
    });

    return NextResponse.json(newMovement, { status: 201 });
  } catch (error) {
    console.error('Error creating capital movement:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
