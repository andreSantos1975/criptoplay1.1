import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { headers } = request;
  const authHeader = headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await prisma.user.updateMany({
      data: {
        chatMessageCount: 0,
      },
    });

    console.log(`[Cron Job] Reset chat message count for ${result.count} users.`);
    return NextResponse.json({
      message: 'Chat message counts reset successfully.',
      userCount: result.count,
    });
  } catch (error) {
    console.error('[Cron Job] Error resetting chat message counts:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
