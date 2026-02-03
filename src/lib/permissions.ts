import { Session } from "next-auth";
import { Subscription } from "@prisma/client";
import { UserPermissions } from "@/types/next-auth.d";

/**
 * Calcula e retorna um objeto estruturado com as permissões do usuário.
 * Esta é a ÚNICA fonte da verdade para as regras de permissão.
 * @param user - Um objeto contendo dados relevantes do usuário para cálculo de permissão.
 */
export function getUserPermissions(user: {
  isAdmin?: boolean;
  subscriptions: Subscription[];
  trialEndsAt?: Date | null;
}): UserPermissions {
  const now = new Date();
  
  // Estado padrão das permissões
  const permissions: UserPermissions = {
    hasActiveSubscription: false,
  };

  if (!user) return permissions;
  
  const { isAdmin, subscriptions, trialEndsAt } = user;

  // 1. Admin tem acesso a tudo
  if (isAdmin) {
    permissions.hasActiveSubscription = true;
    return permissions;
  }

  // 2. Verifica se tem alguma assinatura ativa (qualquer origem: Hotmart, Mercado Pago, etc.)
  const hasPaidSubscription = subscriptions.some(sub => sub.status === 'active' || sub.status === 'authorized');
  
  // 3. Verifica se está em período de teste (trial)
  const isInTrial = trialEndsAt && new Date(trialEndsAt) > now;

  // 4. Acesso é concedido para assinantes PAGOS ou quem está em TRIAL
  permissions.hasActiveSubscription = hasPaidSubscription || isInTrial;

  return permissions;
}


/**
 * (Refatorado) Verifica se o usuário tem uma assinatura ativa ou está em trial.
 * Agora consome o objeto de permissões da sessão.
 */
export function hasActiveSubscription(session: Session | null): boolean {
  if (!session?.user?.permissions) {
    return false;
  }
  return session.user.permissions.hasActiveSubscription;
}
