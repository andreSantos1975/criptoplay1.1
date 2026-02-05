import { Session } from "next-auth";
import { Subscription, HotmartPurchase } from "@prisma/client";
import { UserPermissions } from "@/types/next-auth.d";
import prisma from "./prisma"; // Importar Prisma

/**
 * Calcula e retorna um objeto estruturado com as permissões do usuário.
 * Esta é a ÚNICA fonte da verdade para as regras de permissão.
 * @param user - Um objeto contendo dados relevantes do usuário para cálculo de permissão.
 */
export async function getUserPermissions(user: {
  email?: string | null;
  isAdmin?: boolean;
  subscriptions: Subscription[];
  trialEndsAt?: Date | null;
  subscriptionStatus?: string | null; // Adicionado para refletir o status global do usuário
}): Promise<UserPermissions> {
  const now = new Date();

  // Estado padrão das permissões
  const permissions: UserPermissions = {
    hasActiveSubscription: false,
    hasCourseAccess: false,
    isInTrial: false,
    hasPaidSubscription: false, // Inicializa a nova propriedade
  };

  if (!user) return permissions;

  const { email, isAdmin, subscriptions, trialEndsAt, subscriptionStatus } = user;

  // 1. Admin tem acesso a tudo
  if (isAdmin) {
    permissions.hasActiveSubscription = true;
    permissions.hasCourseAccess = true;
    permissions.isInTrial = false; // Admin não está em "trial"
    permissions.hasPaidSubscription = true; // Admin sempre tem acesso pago
    return permissions;
  }

  // 2. Verifica se está em período de teste (trial)
  const isInTrial = !!(trialEndsAt && new Date(trialEndsAt) > now);
  permissions.isInTrial = isInTrial;

  // 3. Verifica se tem alguma assinatura paga ativa (Prioriza o status geral do usuário)
  let hasPaidSubscription = false;
  if (subscriptionStatus === 'active' || subscriptionStatus === 'authorized') {
    hasPaidSubscription = true;
  } else if (subscriptionStatus === 'cancelled' || subscriptionStatus === 'paused' || subscriptionStatus === 'pending') {
    hasPaidSubscription = false; // Se o status geral do usuário é inativo, não tem assinatura paga ativa
  } else {
    // Fallback: Se user.subscriptionStatus não for conclusivo, verificar o array de subscriptions
    // Isso pode ocorrer para usuários legados ou inconsistências, mas o ideal é que user.subscriptionStatus
    // seja a fonte primária para a elegibilidade geral de assinatura.
    hasPaidSubscription = subscriptions.some(sub => sub.status === 'active' || sub.status === 'authorized');
  }
  permissions.hasPaidSubscription = hasPaidSubscription;

  // 4. Verifica se tem compra registrada na Hotmart
  let hasPurchasedFromHotmart = false;
  if (email) {
    const hotmartPurchase = await prisma.hotmartPurchase.findUnique({
      where: { buyerEmail: email },
    });
    // Consideramos acesso se a compra existir e tiver sido resgatada (ou o status que definirmos como válido)
    if (hotmartPurchase && (hotmartPurchase.status === 'REDEEMED' || hotmartPurchase.status === 'approved' || hotmartPurchase.status === 'completed')) {
      hasPurchasedFromHotmart = true;
    }
  }

  // 5. Permissão para o CURSO é concedida para assinantes PAGOS ou compradores da Hotmart
  permissions.hasCourseAccess = hasPaidSubscription || hasPurchasedFromHotmart;

  // 6. Acesso geral a funcionalidades (incluindo trial)
  // hasActiveSubscription é baseado em ter uma assinatura paga ATIVA ou estar em período de teste
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

