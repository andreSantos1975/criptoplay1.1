import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { processAlerts } from '@/lib/alert-processor';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getServerSession(authOptions);

  // Ensure user is authenticated
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log(`[Manual Trigger] User ${session.user.id} initiated manual alert processing.`);
    // Directly call the core processing function
    await processAlerts();
    console.log('[Manual Trigger] Manual alert processing completed successfully.');
    return NextResponse.json({ message: 'Alert processing triggered successfully.' });
  } catch (error) {
    console.error('[Manual Trigger] Error during manual alert processing:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing alerts.' },
      { status: 500 }
    );
  }
}
