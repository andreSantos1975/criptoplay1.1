import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/progress
// Fetches all progress for the currently authenticated user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userProgress = await prisma.userProgress.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        slug: true,
        completed: true,
      },
    });

    return NextResponse.json(userProgress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/progress
// Marks a course slug as completed for the currently authenticated user
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await request.json();

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const newProgress = await prisma.userProgress.upsert({
      where: {
        userId_slug: {
          userId: session.user.id,
          slug: slug,
        },
      },
      update: {
        completed: true,
      },
      create: {
        userId: session.user.id,
        slug: slug,
        completed: true,
      },
    });

    return NextResponse.json(newProgress, { status: 201 });
  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
