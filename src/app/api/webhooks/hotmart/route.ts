import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

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

      // Check if this email is already in our list
      const existingPurchase = await prisma.hotmartPurchase.findUnique({
        where: { buyerEmail },
      });

      if (existingPurchase) {
        console.log(`Purchase for email ${buyerEmail} already recorded. Skipping.`);
      } else {
        // Add the new buyer's email to our special list
        await prisma.hotmartPurchase.create({
          data: {
            buyerEmail: buyerEmail,
            status: 'PENDING',
          },
        });
        console.log(`Successfully added ${buyerEmail} to Hotmart purchase list.`);
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