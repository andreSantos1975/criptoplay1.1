
import NextAuth, { NextAuthOptions, SessionStrategy } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from 'bcryptjs'
import prisma from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: "Email", type: "text" },
          password: {  label: "Password", type: "password" }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return user;
        }
    })
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  // Adicionando os callbacks para popular o token e a sessão com o ID do usuário
  callbacks: {
    async jwt({ token, user }) {
      // No login inicial, o objeto 'user' está disponível
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Adiciona o ID do token ao objeto da sessão
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
