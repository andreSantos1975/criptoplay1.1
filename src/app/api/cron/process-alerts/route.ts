import { NextResponse } from 'next/server';
import { processAlerts } from '@/lib/alert-processor';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await processAlerts();
    return NextResponse.json({ message: 'Alerts processed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error processing alerts:', error);
    return NextResponse.json({ message: 'Error processing alerts' }, { status: 500 });
  }
}

// Respond to OPTIONS method for preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
