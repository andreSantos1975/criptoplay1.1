import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AlertStatus } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const notificationCount = await prisma.alert.count({
      where: {
        userId: session.user.id,
        status: AlertStatus.TRIGGERED,
      },
    });

    return NextResponse.json({ count: notificationCount });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
