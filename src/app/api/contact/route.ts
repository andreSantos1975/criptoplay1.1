import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return new NextResponse('Missing fields', { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('CONTACT_POST_ERROR', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}