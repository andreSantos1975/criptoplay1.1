
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
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

