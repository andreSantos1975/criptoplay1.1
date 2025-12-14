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
      username?: string | null; // Adicionado username
    } & DefaultSession['user']; // Merge with default user properties
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's unique identifier. */
    id: string;
    username?: string | null; // Adicionado username
  }
}
