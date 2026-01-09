import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AlertStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.alert.updateMany({
      where: {
        userId: session.user.id,
        status: AlertStatus.TRIGGERED,
      },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
      },
    });

    return NextResponse.json({ message: 'Notifications acknowledged' });
  } catch (error) {
    console.error('Error acknowledging notifications:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
