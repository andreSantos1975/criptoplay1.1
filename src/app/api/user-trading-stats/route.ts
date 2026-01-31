import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getUserTradingStats } from '@/lib/financial-data';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  try {
    const tradingStats = await getUserTradingStats(session.user.id);
    console.log(`[user-trading-stats] Returning trading stats:`, tradingStats);
    return NextResponse.json(tradingStats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de trading do usuário:', error);
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar estatísticas de trading.' }, { status: 500 });
  }
}