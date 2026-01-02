"use client";

import { useSession } from "next-auth/react";
import { AlertTriangle, Send } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export const EmailVerificationAlert = () => {
  const { data: session } = useSession();
  const [isResending, setIsResending] = useState(false);

  // Se o usuário não estiver logado ou já tiver verificado o email, não mostra nada
  if (!session?.user || session.user.emailVerified) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
        // Implementar endpoint de reenvio se necessário, 
        // ou instruir o usuário a verificar a caixa de spam.
        // Por enquanto, vamos apenas simular ou usar uma rota de API simples se você quiser criar uma.
        // Como o foco agora é a UX, um toast informativo é um bom começo.
        toast.success("Se não encontrar o e-mail, verifique sua caixa de Spam.");
    } catch (error) {
        toast.error("Erro ao solicitar reenvio.");
    } finally {
        setIsResending(false);
    }
  };

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-yellow-500 w-5 h-5 mt-0.5" />
        <div>
          <h3 className="text-yellow-500 font-semibold text-sm">Verifique seu e-mail</h3>
          <p className="text-yellow-500/80 text-sm mt-1">
            Enviamos um link de confirmação para <strong>{session.user.email}</strong>. 
            Confirme para garantir a segurança da sua conta e evitar bloqueios futuros.
          </p>
        </div>
      </div>
      {/* 
      <button 
        onClick={handleResendEmail}
        disabled={isResending}
        className="text-yellow-500 text-sm font-medium hover:text-yellow-400 flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {isResending ? "Enviando..." : "Reenviar E-mail"}
      </button>
      */}
    </div>
  );
};
