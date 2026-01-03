// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lista de rotas que exigem uma assinatura válida
  const protectedRoutes = ['/curso', '/relatorios', '/alertas'];

  // Verifica se a rota atual está na lista de rotas protegidas
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Critérios de acesso: desenvolvedor, assinatura recorrente ou plano vitalício
    const isDeveloper = token?.isAdmin === true;
    const hasRecurringSubscription = token?.subscriptionStatus === 'authorized';
    const hasLifetimePlan = token?.subscriptionStatus === 'lifetime';

    // Verifica se o período de trial ainda está ativo
    const isTrialActive = token?.trialEndsAt ? new Date(token.trialEndsAt) > new Date() : false;

    // Se não houver token ou se o usuário não atender a nenhum dos critérios de acesso (assinatura ou trial)
    if (!token || (!isDeveloper && !hasRecurringSubscription && !hasLifetimePlan && !isTrialActive)) {
      const url = req.nextUrl.clone();
      url.pathname = '/assinatura';
      return NextResponse.redirect(url);
    }
  }

  // Se o usuário estiver autorizado (ou a rota não for protegida ou for o dashboard), continua
  return NextResponse.next();
}

// Configuração do matcher para definir em quais rotas este middleware deve ser executado.
export const config = {
  matcher: ['/curso/:path*', '/relatorios/:path*', '/alertas/:path*'],
};

