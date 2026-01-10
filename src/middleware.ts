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
    let isTrialActive = false;
    
    // Log para depuração em produção
    console.log(`[Middleware Check] Path: ${pathname}`);
    console.log(`[Middleware Check] Token ID: ${token?.id}`);
    console.log(`[Middleware Check] Token trialEndsAt: ${token?.trialEndsAt} (Type: ${typeof token?.trialEndsAt})`);
    console.log(`[Middleware Check] Token createdAt: ${token?.createdAt} (Type: ${typeof token?.createdAt})`);
    
    if (token?.trialEndsAt) {
      const trialEnd = new Date(token.trialEndsAt);
      isTrialActive = trialEnd > new Date();
      console.log(`[Middleware Check] Trial check via trialEndsAt: ${isTrialActive}`);
    } else if (token?.createdAt) {
      // Fallback: Se trialEndsAt não estiver no token (ex: cookie antigo), calcula baseado em createdAt (7 dias)
      const createdAt = new Date(token.createdAt);
      const now = new Date();
      const trialPeriodMs = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos
      
      // Se a conta tem menos de 7 dias, considera trial ativo
      if ((now.getTime() - createdAt.getTime()) < trialPeriodMs) {
        isTrialActive = true;
      }
      console.log(`[Middleware Check] Fallback check via createdAt. Diff: ${now.getTime() - createdAt.getTime()}, Allowed: ${trialPeriodMs}, Result: ${isTrialActive}`);
    }

    // Se não houver token ou se o usuário não atender a nenhum dos critérios de acesso (assinatura ou trial)
    if (!token || (!isDeveloper && !hasRecurringSubscription && !hasLifetimePlan && !isTrialActive)) {
      console.log(`[Middleware Check] ACCESS DENIED. Redirecting to /assinatura`);
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

