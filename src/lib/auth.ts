import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuthOptions, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";
import { getUserPermissions } from "./permissions"; // 1. IMPORTAR a nova função

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "email", type: "text" },
        password: { label: "password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user?.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      /// No login inicial
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin || false;
        token.username = (user as any).username || null;
        token.hasPassword = !!(user as any).password;
        token.image = user.image;
        token.email = user.email; // Garantir que o email está no token
      }

      // Em requisições subsequentes ou quando a sessão for atualizada
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          // 2. INCLUIR as assinaturas na busca
          include: { 
            subscriptions: true,
          }, 
        });

        if (dbUser) {
          // 3. CALCULAR as permissões usando a função centralizada (agora assíncrona)
          const permissions = await getUserPermissions(dbUser);

          // Atualizar token com dados do DB e permissões
          token.isAdmin = dbUser.isAdmin;
          token.username = dbUser.username;
          token.createdAt = dbUser.createdAt;
          token.emailVerified = dbUser.emailVerified;
          token.trialEndsAt = dbUser.trialEndsAt;
          token.hasPassword = !!dbUser.password;
          token.image = dbUser.image;
          token.permissions = permissions; // 4. ANEXAR permissões ao token
          token.subscriptionStatus = dbUser.subscriptionStatus; // Popula token.subscriptionStatus do dbUser

                  }
      }
      
      // Permitir que usuário LIFETIME contorne checagens de assinatura
      if (token.email === process.env.LIFETIME_USER_EMAIL) {
        if (token.permissions) {
          token.permissions.hasActiveSubscription = true;
          token.permissions.hasCourseAccess = true; // Garantir acesso ao curso também
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.subscriptionStatus = token.subscriptionStatus as string | null;
        session.user.username = token.username as string | null;
        session.user.createdAt = token.createdAt as Date;
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.trialEndsAt = token.trialEndsAt as Date | null;
        session.user.hasPassword = token.hasPassword as boolean;
        session.user.image = token.image as string | null;
        // 5. PASSAR as permissões do token para a sessão
        session.user.permissions = token.permissions;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  events: {
    async createUser({ user }) {
      if (user.email) {
        const baseName = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        const suffix = Math.floor(1000 + Math.random() * 9000).toString();
        const username = `${baseName}${suffix}`;
        
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);

        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { 
              username,
              trialEndsAt
            },
          });
        } catch (error) {
          console.error("Error auto-generating username or setting trial:", error);
        }
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
