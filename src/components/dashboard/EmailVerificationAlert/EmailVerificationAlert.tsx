"use client";

import { useSession } from "next-auth/react";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import styles from './EmailVerificationAlert.module.css';

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
        toast.success("Se não encontrar o e-mail, verifique sua caixa de Spam.");
    } catch (error) {
        toast.error("Erro ao solicitar reenvio.");
    } finally {
        setIsResending(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <AlertTriangle className={styles.icon} />
        <div>
          <h3 className={styles.title}>Verifique seu e-mail</h3>
          <p className={styles.message}>
            Enviamos um link de confirmação para <strong>{session.user.email}</strong>. 
            Confirme para garantir a segurança da sua conta e evitar bloqueios futuros.
          </p>
        </div>
      </div>
    </div>
  );
};
