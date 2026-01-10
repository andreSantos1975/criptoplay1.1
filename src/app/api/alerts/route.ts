import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { AlertStatus } from '@prisma/client';
// import { hasPremiumAccess } from '@/lib/permissions'; // Removido pois alertas serão acessíveis a todos

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // if (!hasPremiumAccess(session)) {
  //   return NextResponse.json({ message: 'Premium access required' }, { status: 403 });
  // }

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
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Removido o check de hasPremiumAccess
  // if (!hasPremiumAccess(session)) {
  //   return NextResponse.json({ message: 'Premium access required' }, { status: 403 });
  // }

  try {
    const body = await request.json();
    console.log('POST /api/alerts received body:', body);

    let dataForDb: any;

    // --- Handle new alert creation from different frontends ---

    // Scenario 1: Data from the main AlertForm (already structured as { type, config })
    // Example: { type: 'PRICE', config: { symbol: 'BTCBRL', operator: 'gt', targetPrice: 50000 }, status: 'ACTIVE' }
    if (body.type && body.config) {
      dataForDb = {
        userId: session.user.id,
        type: body.type, // Expects 'PRICE', 'BUDGET', etc.
        config: body.config,
        status: AlertStatus.ACTIVE, // Ensure new alerts are active
      };
      // Add validation for config based on type if necessary
      if (body.type === 'PRICE' && (!body.config.symbol || body.config.targetPrice === undefined || !body.config.operator)) {
          return NextResponse.json({ message: 'Missing required config fields for PRICE alert' }, { status: 400 });
      }
    }
    // Scenario 2: Data from chart-based alert creation ({ symbol, price, condition })
    // Example: { symbol: 'BTCBRL', price: 486639, condition: 'above' }
    else if (body.symbol && body.price !== undefined && body.condition) {
        // Convert to standard internal structure
        const operator = body.condition === 'above' ? 'gt' : 'lt';
        dataForDb = {
            userId: session.user.id,
            type: 'PRICE', // Chart alerts are always PRICE type
            config: {
                symbol: body.symbol,
                targetPrice: parseFloat(body.price), // Ensure price is parsed as number
                operator: operator,
            },
            status: AlertStatus.ACTIVE, // Ensure new alerts are active
        };
    }
    // If neither shape matches
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

  // Removido o check de hasPremiumAccess
  // if (!hasPremiumAccess(session)) {
  //   return NextResponse.json({ message: 'Premium access required' }, { status: 403 });
  // }

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

  // Removido o check de hasPremiumAccess
  // if (!hasPremiumAccess(session)) {
  //   return NextResponse.json({ message: 'Premium access required' }, { status: 403 });
  // }

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
