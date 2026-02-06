import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// IMPORTANT: This is the secret you get from the Hotmart webhook configuration page.
// It must be set in your .env.local file.
const HOTMART_WEBHOOK_SECRET = process.env.HOTMART_WEBHOOK_SECRET;

async function verifyHotmartSignature(request: NextRequest, body: Buffer): Promise<boolean> {
  const signature = request.headers.get('x-hotmart-hottok');

  if (!signature || !HOTMART_WEBHOOK_SECRET) {
    console.error('Webhook secret or signature is missing.');
    return false;
  }

  try {
    const hash = crypto.createHmac('sha256', HOTMART_WEBHOOK_SECRET).update(body).digest('hex');
    return hash === signature;
  } catch (error) {
    console.error('Error verifying Hotmart signature:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const bodyBuffer = Buffer.from(rawBody, 'utf-8');
    
    // --- 1. Verify Signature ---
    const isVerified = await verifyHotmartSignature(request, bodyBuffer);
    if (!isVerified) {
      console.warn('Invalid Hotmart webhook signature received.');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    // --- 2. Parse Payload ---
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const data = payload.data;

    console.log(`Received Hotmart event: ${event}`);

    // --- 3. Process Only Approved Purchases ---
    if (event === 'purchase:approved') {
      const buyerEmail = data?.buyer?.email;

      if (!buyerEmail) {
        console.warn('Webhook received for approved purchase, but buyer email is missing.');
        // Return 200 to prevent Hotmart from retrying on malformed data.
        return NextResponse.json({ message: 'Email missing' }, { status: 200 });
      }

      const productHotmartId = data?.product?.id; // ID do produto na Hotmart
      const productHotmartName = data?.product?.name; // Nome do produto na Hotmart
      const purchasePrice = data?.price?.value; // Valor da compra

      if (!buyerEmail) {
        console.warn('Webhook received for approved purchase, but buyer email is missing.');
        // Return 200 to prevent Hotmart from retrying on malformed data.
        return NextResponse.json({ message: 'Email missing' }, { status: 200 });
      }

      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email: buyerEmail },
      });

      if (user) {
        // User found, update subscription status and create Subscription record
        await prisma.$transaction(async (tx) => {
          // Update User's subscription status
          await tx.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: 'PRO' }, // Assuming 'PRO' indicates a Pro subscription
          });

          // Create a new Subscription record
          await tx.subscription.create({
            data: {
              userId: user.id,
              status: 'active',
              planName: productHotmartName || 'Plano Hotmart (Nome não especificado)', // Use product name from Hotmart
              amount: new Prisma.Decimal(purchasePrice || 0), // Use purchase price
              origin: 'HOTMART',
              type: 'LIFETIME', // Assuming Hotmart purchases are LIFETIME for now, adjust if necessary
              // You might want to calculate endDate based on the product type (e.g., 1 year from now)
            },
          });

          // Upsert HotmartPurchase status to REDEEMED
          await tx.hotmartPurchase.upsert({
            where: { buyerEmail: buyerEmail },
            update: { status: 'REDEEMED' },
            create: {
              buyerEmail: buyerEmail,
              status: 'REDEEMED',
            },
          });
          console.log(`User ${user.email} subscription updated to PRO and Subscription record created.`);
        });
      } else {
        // User not found, just record the Hotmart purchase as PENDING
        await prisma.hotmartPurchase.upsert({
          where: { buyerEmail: buyerEmail },
          update: {}, // No specific update if not found, just create or ensure existence
          create: {
            buyerEmail: buyerEmail,
            status: 'PENDING', // Keep as PENDING if user not found, requires manual linking
          },
        });
        console.warn(`User with email ${buyerEmail} not found. Hotmart purchase recorded as PENDING.`);
      }
    }

    // --- 4. Acknowledge Receipt ---
    // Always return a 200 OK to let Hotmart know we've received the event.
    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });

  } catch (error) {
    console.error('Error processing Hotmart webhook:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}