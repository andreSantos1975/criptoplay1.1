
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Interface to represent the expected data structure from Hotmart
interface HotmartPurchase {
  event: string;
  data: {
    buyer: {
      email: string;
      name: string;
    };
    // Include other relevant fields from the Hotmart payload as needed
  };
}

// This is your secret token.
// IMPORTANT: For production, move this to your environment variables (.env.local)
// Example: HOTMART_SECRET_TOKEN=your_super_secret_string
const HOTMART_SECRET = process.env.HOTMART_SECRET_TOKEN || 'YOUR_SECRET_TOKEN_HERE';

export async function POST(req: NextRequest) {
  console.log('Hotmart webhook received');

  // 1. Validate the request security
  const hotmartToken = req.headers.get('x-hotmart-hottok');
  if (hotmartToken !== HOTMART_SECRET) {
    console.error('Invalid Hotmart secret token');
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = (await req.json()) as HotmartPurchase;
    console.log('Payload received:', JSON.stringify(payload, null, 2));

    // 2. We only care about approved purchases
    if (payload.event !== 'purchase.approved') {
      return NextResponse.json(
        { success: true, message: `Event ${payload.event} ignored` },
        { status: 200 }
      );
    }

    const { email, name } = payload.data.buyer;

    if (!email) {
      console.error('Email not found in payload');
      return NextResponse.json({ success: false, message: 'Buyer email is missing' }, { status: 400 });
    }

    // 3. Calculate the new trial end date (30 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // 4. Use `upsert` to create a new user or update an existing one
    // - If user with `email` exists, it will be updated.
    // - If not, a new user will be created with the provided data.
    const user = await prisma.user.upsert({
      where: { email: email },
      update: {
        trialEndsAt: trialEndsAt,
      },
      create: {
        email: email,
        name: name,
        trialEndsAt: trialEndsAt,
        // You might want to set default values for other required fields
        // e.g., password, username, etc. if your schema requires them.
        // For now, we are assuming email and name are sufficient for creation.
      },
    });

    console.log(`User ${user.email} processed. Trial ends at: ${trialEndsAt.toISOString()}`);

    // 5. Respond to Hotmart with success
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing Hotmart webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
