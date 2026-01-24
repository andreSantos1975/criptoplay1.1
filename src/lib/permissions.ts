import { Session } from "next-auth";

/**
 * Verifica se o usuário tem acesso às funcionalidades Premium (Simulador, Alertas, Relatórios).
 * O acesso é concedido se:
 * 1. O usuário é Admin/Desenvolvedor.
 * 2. O usuário possui uma assinatura ativa ('authorized' ou 'lifetime').
 * 3. O usuário está dentro do período de testes (trial).
 */
export function hasPremiumAccess(session: Session | null): boolean {
  if (!session || !session.user) {
    return false;
  }

  const { isAdmin, subscriptionStatus, trialEndsAt, createdAt } = session.user;
  const now = new Date();

  // 1. Acesso Admin/Developer
  if (isAdmin) return true;

  // 2. Assinatura Ativa
  if (subscriptionStatus === 'authorized' || subscriptionStatus === 'lifetime') {
    return true;
  }

  // 3. Período de Teste
  // Prioriza trialEndsAt se disponível
  if (trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    if (trialEnd > now) {
      return true;
    }
  } 
  // Fallback: Se trialEndsAt não definido, usa createdAt (7 dias de trial)
  else if (createdAt) {
    const creationDate = new Date(createdAt);
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if ((now.getTime() - creationDate.getTime()) < sevenDaysInMs) {
      return true;
    }
  }

  return false;
}

/**
 * Verifica se o usuário tem acesso ao conteúdo exclusivo para assinantes (ex: Curso).
 * O acesso é concedido APENAS se:
 * 1. O usuário é Admin/Desenvolvedor.
 * 2. O usuário possui uma assinatura PAGA e ativa ('authorized' ou 'lifetime').
 * ESTA FUNÇÃO EXCLUI USUÁRIOS EM PERÍODO DE TESTE.
 */
export function hasSubscriptionAccess(session: Session | null): boolean {
  if (!session || !session.user) {
    return false;
  }

  const { isAdmin, subscriptionStatus } = session.user;

  // 1. Acesso Admin/Developer
  if (isAdmin) return true;

  // 2. Assinatura Ativa e Paga
  if (subscriptionStatus === 'authorized' || subscriptionStatus === 'lifetime') {
    return true;
  }

  return false;
}
