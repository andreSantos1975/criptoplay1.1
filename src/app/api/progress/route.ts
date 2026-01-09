import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const progress = await prisma.userProgress.findMany({
      where: {
        userId: session.user.id,
        completed: true,
      },
      select: {
        slug: true,
      },
    });

    const completedSlugs = progress.map((p) => p.slug);
    return NextResponse.json({ completedSlugs });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const progress = await prisma.userProgress.upsert({
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

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}