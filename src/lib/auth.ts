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
        token.username = (user as any).username || null;
        token.createdAt = (user as any).createdAt || null;
        token.emailVerified = (user as any).emailVerified || null;
        token.trialEndsAt = (user as any).trialEndsAt || null; // Add trialEndsAt here
        token.hasPassword = !!(user as any).password;
        token.image = user.image;
      }

      // On subsequent requests, refresh token data from the database
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { 
            id: true, 
            isAdmin: true, 
            subscriptionStatus: true, 
            username: true, 
            createdAt: true, 
            emailVerified: true, 
            trialEndsAt: true,
            password: true, // Needed to check existence
            image: true
          }, 
        });

        if (dbUser) {
          token.isAdmin = dbUser.isAdmin;
          token.subscriptionStatus = dbUser.subscriptionStatus;
          token.username = dbUser.username;
          token.createdAt = dbUser.createdAt; // Add createdAt here
          token.emailVerified = dbUser.emailVerified;
          token.trialEndsAt = dbUser.trialEndsAt; // Add trialEndsAt here
          token.hasPassword = !!dbUser.password;
          token.image = dbUser.image;
        }
      }
      
      // Allow dev user to bypass subscription checks
      if (process.env.NODE_ENV === 'development' && token.email === process.env.DEV_USER_EMAIL) {
        token.isAdmin = true;
        token.subscriptionStatus = 'authorized';
        // Dev user also gets full trial access indefinitely
        token.trialEndsAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years for dev
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
        session.user.username = token.username as string | null;
        session.user.createdAt = token.createdAt as Date; // Add createdAt here
        session.user.emailVerified = token.emailVerified as Date | null;
        session.user.trialEndsAt = token.trialEndsAt as Date | null; // Add trialEndsAt here
        session.user.hasPassword = token.hasPassword as boolean;
        session.user.image = token.image as string | null;
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
        
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { username },
          });
        } catch (error) {
          console.error("Error auto-generating username:", error);
        }
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
