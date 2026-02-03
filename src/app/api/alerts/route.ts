import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AlertStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const alerts = await prisma.alert.findMany({
      where: {
        userId: session.user.id,
        NOT: {
          status: AlertStatus.DELETED,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ message: 'Error fetching alerts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.permissions) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }



  try {
    const body = await request.json();
    console.log('POST /api/alerts received body:', body);

    let dataForDb: any;

    if (body.type && body.config) {
      dataForDb = {
        userId: session.user.id,
        type: body.type,
        config: body.config,
        status: AlertStatus.ACTIVE,
      };
      if (body.type === 'PRICE' && (!body.config.symbol || body.config.targetPrice === undefined || !body.config.operator)) {
          return NextResponse.json({ message: 'Missing required config fields for PRICE alert' }, { status: 400 });
      }
    }
    else if (body.symbol && body.price !== undefined && body.condition) {
        const operator = body.condition === 'above' ? 'gt' : 'lt';
        dataForDb = {
            userId: session.user.id,
            type: 'PRICE',
            config: {
                symbol: body.symbol,
                targetPrice: parseFloat(body.price),
                operator: operator,
            },
            status: AlertStatus.ACTIVE,
        };
    }
    else {
      return NextResponse.json({ message: 'Invalid alert data structure. Missing type/config or symbol/price/condition.' }, { status: 400 });
    }

    const newAlert = await prisma.alert.create({ data: dataForDb });
    return NextResponse.json(newAlert, { status: 201 });

  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json({ message: 'Error creating alert' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...dataToUpdate } = body;

    if (!id) {
      return NextResponse.json({ message: 'Alert ID is required' }, { status: 400 });
    }

    const updatedAlert = await prisma.alert.update({
      where: { id },
      data: {
        ...dataToUpdate,
        status: AlertStatus.ACTIVE,
        triggeredAt: null,
      },
    });
    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ message: 'Error updating alert' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ message: 'Alert ID is required' }, { status: 400 });
    }

    await prisma.alert.update({
      where: { id },
      data: { status: AlertStatus.DELETED },
    });
    return NextResponse.json({ message: 'Alert deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return NextResponse.json({ message: 'Error deleting alert' }, { status: 500 });
  }
}
