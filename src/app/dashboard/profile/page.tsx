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

      // Atualiza a sessão do NextAuth com o novo username
      // Isso é importante para que o UI reflita a mudança sem precisar de refresh completo
      await update({ username: newUsername }); // Isso pode precisar de um ajuste na tipagem da sessão, vou adicionar depois

      setCurrentUsername(newUsername);
      toast.success('Apelido atualizado com sucesso!');

    } catch (error: any) {
      toast.error(error.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return <p>Carregando perfil...</p>;
  }

  // Se o usuário não estiver logado, o useEffect já redirecionou
  // Caso session.user esteja disponível, mas username não, aguardamos a chamada fetch
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
    </div>
  );
}
