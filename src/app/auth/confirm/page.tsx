import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

interface ConfirmPageProps {
  searchParams: { token: string };
}

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) {
  const token = searchParams.token;

  if (!token) {
    return (
      <main className="bg-black text-white p-4 pt-32">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Erro de Verificação</h1>
          <p className="mb-6">Token não fornecido.</p>
          <Link href="/dashboard" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
            Ir para o Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const existingToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!existingToken) {
    return (
      <main className="bg-black text-white p-4" style={{ paddingTop: '8rem' }}>
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Token Inválido ou Expirado</h1>
          <p className="mb-6">O link de verificação não é válido ou já foi utilizado.</p>
          <Link href="/dashboard" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
            Ir para o Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return (
      <main className="bg-black text-white p-4 pt-32">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Link Expirado</h1>
          <p className="mb-6">Este link de verificação expirou.</p>
          <Link href="/dashboard" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
            Ir para o Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.identifier },
  });

  if (!existingUser) {
    return (
      <main className="bg-black text-white p-4 pt-32">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Erro de Usuário</h1>
          <p className="mb-6">O e-mail associado a este token não foi encontrado.</p>
          <Link href="/login" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">
            Fazer Login
          </Link>
        </div>
      </main>
    );
  }

  // Atualizar o usuário e deletar o token
  await prisma.user.update({
    where: { id: existingUser.id },
    data: { 
      emailVerified: new Date(),
    },
  });

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: existingToken.identifier, token: existingToken.token } },
  });

  return (
    <main className="bg-black text-white p-4" style={{ paddingTop: '8rem' }}>
      <div className="flex flex-col items-center text-center">
        <div className="bg-green-500/10 border border-green-500 p-8 rounded-lg text-center max-w-md">
          <h1 className="text-3xl font-bold text-green-500 mb-4">Email Confirmado! 🚀</h1>
          <p className="text-gray-300 mb-8">
            Sua conta foi verificada com sucesso. Você agora tem acesso seguro a todos os recursos da CriptoPlay.
          </p>
          <Link 
            href="/dashboard" 
            className="inline-block w-full px-6 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition-colors"
          >
            Acessar Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
