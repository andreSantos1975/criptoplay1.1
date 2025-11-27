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
      // No login inicial, o objeto `user` está disponível e seu ID é adicionado ao token.
      if (user) {
        token.id = user.id;
      }

      // Em requisições subsequentes, usamos o email do token (que é mais confiável)
      // para buscar o usuário no banco de dados.
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

        // Se o usuário não for encontrado (ex: foi deletado), retornamos o token como está.
        // Isso evita que a sessão seja invalidada com um erro, corrigindo o build.
        // A sessão continuará válida até expirar, mas sem dados atualizados do usuário.
        if (!dbUser) {
          return token;
        }

        // Se o usuário for encontrado, garantimos que o ID no token está correto.
        token.id = dbUser.id;
      }

      // Retorna o token (potencialmente modificado).
      return token;
    },
    async session({ session, token }) {
      // O callback `session` é chamado após o callback `jwt`.
      // O objeto `token` aqui é o que foi retornado do callback `jwt`.
      if (token && session.user) {
        session.user.id = token.id as string;
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
