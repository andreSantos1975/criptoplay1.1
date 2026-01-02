// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Lista de rotas que exigem autenticação e assinatura
  const protectedRoutes = ['/dashboard', '/curso'];

  // Verifica se a rota atual está na lista de rotas protegidas
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Critérios de acesso
    const isDeveloper = token?.isAdmin === true;
    const hasRecurringSubscription = token?.subscriptionStatus === 'authorized';
    const hasLifetimePlan = token?.subscriptionStatus === 'lifetime';

    // Calcula se o usuário está dentro do período de teste de 1 hora (Teste temporário)
    // Usamos Math.abs para evitar erros com fusos horários diferentes ou relógios desajustados
    const diffInMilliseconds = new Date().getTime() - new Date(token.createdAt).getTime();
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
    
    const isTrialActive = token?.createdAt ? diffInHours < 1 : false;

    // Se não houver token ou se o usuário não atender a nenhum dos critérios de acesso
    if (!token || (!isDeveloper && !hasRecurringSubscription && !hasLifetimePlan && !isTrialActive)) {
      const url = req.nextUrl.clone();
      url.pathname = '/assinatura';
      return NextResponse.redirect(url);
    }
  }

  // Se o usuário estiver autorizado ou a rota não for protegida, continua
  return NextResponse.next();
}

// Configuração do matcher para definir em quais rotas este middleware deve ser executado.
export const config = {
  matcher: ['/dashboard/:path*', '/curso/:path*'],
};
