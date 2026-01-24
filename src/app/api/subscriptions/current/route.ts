// src/app/api/subscriptions/current/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * API endpoint to retrieve the user's current active subscription.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        // An active subscription is either 'authorized' (recurring) or 'active' (lifetime/legacy)
        status: { in: ['authorized', 'active'] },
      },
      orderBy: {
        createdAt: 'desc', // Get the most recent active subscription
      },
    });

    if (!subscription) {
      return NextResponse.json(null, { status: 200 }); // No active subscription found, which is not an error
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    return NextResponse.json({ message: 'Error fetching subscription' }, { status: 500 });
  }
}
