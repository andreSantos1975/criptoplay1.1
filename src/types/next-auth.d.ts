import 'next-auth';
import 'next-auth/jwt';
import { DefaultSession } from 'next-auth';

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
  }
}