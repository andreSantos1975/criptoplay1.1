import { Session } from "next-auth";

/**
 * Verifica se o usuário tem acesso às funcionalidades Premium (Simulador, Alertas, Relatórios, Curso).
 * O acesso é concedido se:
 * 1. O usuário é Admin/Desenvolvedor.
 * 2. O usuário possui uma assinatura ativa ('authorized' ou 'lifetime').
 * 3. O usuário está dentro do período de testes (trial).
 */
export function hasPremiumAccess(session: Session | null): boolean {
  if (!session || !session.user) {
    return false;
  }

  const { isAdmin, subscriptionStatus, trialEndsAt } = session.user;

  // 1. Acesso Admin/Developer
  if (isAdmin) return true;

  // 2. Assinatura Ativa
  if (subscriptionStatus === 'authorized' || subscriptionStatus === 'lifetime') {
    return true;
  }

  // 3. Período de Teste
  if (trialEndsAt) {
    const trialEnd = new Date(trialEndsAt);
    if (trialEnd > new Date()) {
      return true;
    }
  }

  return false;
}
