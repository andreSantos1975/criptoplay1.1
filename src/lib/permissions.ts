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
  subscriptionStatus?: string | null;
  subscriptions: Subscription[];
  trialEndsAt?: Date | null;
  createdAt?: Date | null;
}): UserPermissions {
  const now = new Date();
  
  // Estado padrão das permissões
  const permissions: UserPermissions = {
    isPremium: false,
    isSubscriber: false,
    hasHotmartAccess: false,
  };

  if (!user) return permissions;
  
  const { isAdmin, subscriptionStatus, subscriptions, trialEndsAt, createdAt } = user;

  // 1. Admin tem acesso a tudo
  if (isAdmin) {
    return { isPremium: true, isSubscriber: true, hasHotmartAccess: true };
  }

  // 2. Verifica acesso via Hotmart
  permissions.hasHotmartAccess = subscriptions.some(
    (sub) => sub.origin === 'HOTMART' && sub.status === 'active'
  );

  // 3. Verifica assinatura paga (Mercado Pago, etc.)
  const hasPaidSubscription = subscriptionStatus === 'authorized' || subscriptionStatus === 'lifetime';
  permissions.isSubscriber = hasPaidSubscription;

  // 4. Verifica se está em período de teste (trial)
  let isInTrial = false;
  if (trialEndsAt && new Date(trialEndsAt) > now) {
    isInTrial = true;
  } else if (createdAt && !trialEndsAt) { // Fallback para usuários antigos sem trialEndsAt
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (now.getTime() - new Date(createdAt).getTime() < sevenDaysInMs) {
      isInTrial = true;
    }
  }

  // 5. Acesso Premium é para assinantes PAGOS ou quem está em TRIAL
  permissions.isPremium = permissions.isSubscriber || isInTrial;

  return permissions;
}


// --- Funções Legadas (Refatoradas para usar o novo sistema) ---

/**
 * (Refatorado) Verifica se o usuário tem acesso às funcionalidades Premium.
 * Agora consome o objeto de permissões da sessão.
 */
export function hasPremiumAccess(session: Session | null): boolean {
  if (!session?.user?.permissions) {
    return false;
  }
  return session.user.permissions.isPremium;
}

/**
 * (Refatorado) Verifica se o usuário tem acesso ao conteúdo exclusivo para assinantes.
 * Agora consome o objeto de permissões da sessão.
 */
export function hasSubscriptionAccess(session: Session | null): boolean {
  if (!session?.user?.permissions) {
    return false;
  }
  return session.user.permissions.isSubscriber;
}
