'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Username State
  const [currentUsername, setCurrentUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (session?.user?.username) {
      setCurrentUsername(session.user.username);
      setNewUsername(session.user.username);
    }
  }, [session, status, router]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingUsername(true);
    toast.dismiss();

    if (newUsername.length < 3 || newUsername.length > 20) {
      toast.error('O apelido deve ter entre 3 e 20 caracteres.');
      setIsUpdatingUsername(false);
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
      toast.error('O apelido só pode conter letras, números, hífens e underscores.');
      setIsUpdatingUsername(false);
      return;
    }
    if (newUsername === currentUsername) {
        toast.error('O novo apelido é igual ao atual.');
        setIsUpdatingUsername(false);
        return;
    }

    try {
      const res = await fetch('/api/profile/update-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao atualizar.');

      await update({ username: newUsername });
      setCurrentUsername(newUsername);
      toast.success('Apelido atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro inesperado.');
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    toast.dismiss();

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      setIsUpdatingPassword(false);
      return;
    }

    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Erro ao atualizar senha.');

      toast.success('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Erro inesperado.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (status === 'loading') return <div className={styles.container}><p>Carregando perfil...</p></div>;

  const user = session?.user;
  const memberSince = user?.createdAt 
    ? format(new Date(user.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : 'Data desconhecida';
  
  const initials = user?.name 
    ? user.name.split(' ')[0][0].toUpperCase()
    : user?.email?.substring(0, 1).toUpperCase() || 'CP';

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Meu Perfil</h1>

      {/* HEADER: AVATAR & INFO */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarContainer}>
          {user?.image ? (
            <Image 
              src={user.image} 
              alt="Avatar do usuário" 
              width={80} // Defina a largura apropriada para o seu avatar
              height={80} // Defina a altura apropriada para o seu avatar
              className={styles.avatarImage} 
            />
          ) : (
            <span className={styles.avatarPlaceholder}>{initials}</span>
          )}
        </div>
        <h2 className={styles.memberName}>{user?.name || 'Usuário CriptoPlay'}</h2>
        <p className={styles.memberSince}>Membro desde {memberSince}</p>
        <div className={styles.emailContainer}>
          <span className={styles.emailText}>{user?.email}</span>
        </div>
      </div>

      {/* USERNAME SECTION */}
      <section className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Alterar Apelido (Ranking)</h3>
        <form onSubmit={handleUpdateUsername} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="newUsername">Novo Apelido</label>
            <input
              type="text"
              id="newUsername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Ex: TraderMestre"
              disabled={isUpdatingUsername}
            />
          </div>
          <button type="submit" className={styles.button} disabled={isUpdatingUsername}>
            {isUpdatingUsername ? 'Salvando...' : 'Salvar Apelido'}
          </button>
        </form>
      </section>

      {/* PASSWORD SECTION (Only if user has password) */}
      {user?.hasPassword && (
        <section className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Alterar Senha</h3>
          <form onSubmit={handleUpdatePassword} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="currentPassword">Senha Atual</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isUpdatingPassword}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="newPassword">Nova Senha</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isUpdatingPassword}
                minLength={6}
              />
            </div>
            <button type="submit" className={styles.button} disabled={isUpdatingPassword}>
              {isUpdatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
            </button>
          </form>
        </section>
      )}

      {/* SUBSCRIPTION SECTION */}
      <section className={styles.sectionCard}>
        <h3 className={styles.sectionTitle}>Assinatura</h3>
        <p className={styles.subscriptionStatus}>
          Status: <span>{user?.subscriptionStatus === 'authorized' ? 'Ativa' : user?.subscriptionStatus || 'Nenhuma'}</span>
        </p>
        {user?.subscriptionStatus !== 'authorized' ? (
          <p style={{ marginTop: '10px' }}>
            Você não possui uma assinatura ativa. <a href="/assinatura" style={{ color: '#0070f3' }}>Assine agora</a> para desbloquear recursos exclusivos!
          </p>
        ) : (
          <a 
            href="https://www.mercadopago.com.br/subscriptions/management" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.manageSubscriptionButton}
          >
            Gerenciar Assinatura
          </a>
        )}
      </section>
    </div>
  );
}