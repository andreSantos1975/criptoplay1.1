// src/app/dashboard/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './profile.module.css'; // Vamos criar este CSS também

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    // Supondo que o username esteja disponível na sessão
    // Se não estiver, precisaremos fazer uma chamada à API para obtê-lo
    if (session?.user?.username) { // Verifica se username existe na sessão
      setCurrentUsername(session.user.username);
      setNewUsername(session.user.username);
    } else {
        // Se o username não estiver na sessão, buscá-lo do servidor
        fetch('/api/user/me') // Vamos precisar criar este endpoint também
            .then(res => res.json())
            .then(data => {
                if (data.username) {
                    setCurrentUsername(data.username);
                    setNewUsername(data.username);
                }
            })
            .catch(error => console.error("Erro ao buscar username:", error));
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    toast.dismiss(); // Limpa toasts anteriores

    if (newUsername.length < 3 || newUsername.length > 20) {
      toast.error('O apelido deve ter entre 3 e 20 caracteres.');
      setIsLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      toast.error('O apelido só pode conter letras, números, hífens e underscores.');
      setIsLoading(false);
      return;
    }
    if (newUsername === currentUsername) {
        toast.error('O novo apelido é igual ao atual.');
        setIsLoading(false);
        return;
    }

    try {
      const res = await fetch('/api/profile/update-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: newUsername }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Erro ao atualizar o apelido.');
      }

      await update({ username: newUsername });

      setCurrentUsername(newUsername);
      toast.success('Apelido atualizado com sucesso!');

    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const subscriptionStatus = session?.user?.subscriptionStatus || 'none';
  const isSubscriptionActive = subscriptionStatus === 'authorized'; // Mercado Pago status for active
  const manageSubscriptionUrl = 'https://www.mercadopago.com.br/subscriptions/management'; // URL genérica para gerenciar assinaturas no MP

  if (status === 'loading') {
    return <p>Carregando perfil...</p>;
  }

  if (!session?.user?.username && !currentUsername) {
      return <p>Buscando dados do usuário...</p>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Meu Perfil</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="currentUsername">Apelido Atual</label>
          <input
            type="text"
            id="currentUsername"
            value={currentUsername}
            disabled
            className={styles.disabledInput}
          />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="newUsername">Novo Apelido</label>
          <input
            type="text"
            id="newUsername"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Atualizando...' : 'Atualizar Apelido'}
        </button>
      </form>

      <div className={styles.subscriptionSection}>
        <h2>Minha Assinatura</h2>
        <p className={styles.subscriptionStatus}>Status: <span>{subscriptionStatus === 'authorized' ? 'Ativa' : subscriptionStatus}</span></p>
        {!isSubscriptionActive && (
          <p>Você não possui uma assinatura ativa. <a href="/assinatura">Assine agora</a> para desbloquear todos os recursos!</p>
        )}
        {isSubscriptionActive && (
          <a href={manageSubscriptionUrl} target="_blank" rel="noopener noreferrer" className={styles.manageSubscriptionButton}>
            Gerenciar Assinatura
          </a>
        )}
      </div>
    </div>
  );
}
