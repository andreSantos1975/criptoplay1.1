import { NextResponse } from 'next/server';
import { processAlerts } from '@/lib/alert-processor';

export const dynamic = 'force-dynamic';

export async function GET() {
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
