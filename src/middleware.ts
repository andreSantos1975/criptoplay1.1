// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Obter o token da sessão
  // O 'secret' é necessário para descriptografar o JWT.
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Proteger todas as rotas do dashboard
  if (pathname.startsWith('/dashboard')) {
    // Se não houver token (usuário não logado) ou a assinatura não estiver ativa...
    // O status 'authorized' do Mercado Pago indica uma assinatura ativa.
    if (!token || token.subscriptionStatus !== 'authorized') {
      
      // Criar a URL de redirecionamento para a página de assinatura.
      const url = req.nextUrl.clone();
      url.pathname = '/assinatura';
      
      // Redireciona o usuário.
      return NextResponse.redirect(url);
    }
  }

  // Se o usuário for um assinante ativo, ou se a rota não for do dashboard,
  // permite que a requisição continue.
  return NextResponse.next();
}

// Configuração do matcher para definir em quais rotas este middleware deve ser executado.
// '/dashboard/:path*' cobre a página principal do dashboard e todas as suas sub-páginas.
export const config = {
  matcher: '/dashboard/:path*',
};
