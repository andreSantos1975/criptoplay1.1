import 'next-auth';
import 'next-auth/jwt';
import { DefaultSession } from 'next-auth';

// Interface para a estrutura de permissões
export interface UserPermissions {
  hasActiveSubscription: boolean;
}

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique identifier. */
      id: string;
      username?: string | null;
      subscriptionStatus?: string | null; // Adicionado status da assinatura
      isAdmin?: boolean;
      createdAt?: Date;
      emailVerified?: Date | null;
      trialEndsAt?: Date | null; // Adicionado campo de término do trial
      hasPassword?: boolean; // Indica se o usuário possui senha definida
      /** Objeto centralizado de permissões do usuário. */
      permissions: UserPermissions;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username?: string | null;
    subscriptionStatus?: string | null; // Adicionado status da assinatura
    isAdmin?: boolean;
    createdAt?: Date;
    emailVerified?: Date | null;
    trialEndsAt?: Date | null; // Adicionado campo de término do trial
    hasPassword?: boolean;
    /** Objeto centralizado de permissões do usuário. */
    permissions: UserPermissions;
  }
}