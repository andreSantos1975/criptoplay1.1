import { PrismaAdapter } from "@auth/prisma-adapter";
import { AuthOptions, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
    async jwt({ token, user }) {
      // On initial sign-in, add user properties to the token
      if (user) {
        token.id = user.id;
        token.isAdmin = (user as any).isAdmin || false;
        token.subscriptionStatus = (user as any).subscriptionStatus || null;
        token.createdAt = (user as any).createdAt || null; // Add createdAt here
      }

      // On subsequent requests, refresh token data from the database
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, isAdmin: true, subscriptionStatus: true, createdAt: true }, // Select createdAt here
        });

        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
          token.subscriptionStatus = dbUser.subscriptionStatus;
          token.createdAt = dbUser.createdAt; // Add createdAt here
        }
      }
      
      // Allow dev user to bypass subscription checks
      if (process.env.NODE_ENV === 'development' && token.email === process.env.DEV_USER_EMAIL) {
        token.isAdmin = true;
        token.subscriptionStatus = 'authorized';
      }

      // Allow lifetime user to bypass subscription checks
      if (token.email === process.env.LIFETIME_USER_EMAIL) {
        token.subscriptionStatus = 'lifetime';
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.subscriptionStatus = token.subscriptionStatus as string | null;
        session.user.createdAt = token.createdAt as Date; // Add createdAt here
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
  secret: process.env.NEXTAUTH_SECRET,
};
