'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import styles from './profile.module.css';
import ProfileHeader from '@/components/profile/ProfileHeader';
import AccountInfo from '@/components/profile/AccountInfo';
import ChangeNickname from '@/components/profile/ChangeNickname';
import ChangePassword from '@/components/profile/ChangePassword';
import AccessStatusSection from '@/components/profile/AccessStatusSection'; // Importar o novo componente

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Username State
  const [currentUsername, setCurrentUsername] = useState('');
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
    }
  }, [session, status, router]);

  const handleUpdateUsername = async (newUsername: string) => {
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

  const handleUpdatePassword = async (currentPassword: string, newPassword: string) => {
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Configurações de Perfil</h1>

      <div className={styles.grid}>
        <ProfileHeader 
          name={user?.name || 'Usuário CriptoPlay'} 
          memberSince={memberSince}
          image={user?.image}
        />

        <AccountInfo email={user?.email || ''} />

        <ChangeNickname 
          currentNickname={currentUsername} 
          onSave={handleUpdateUsername}
          isLoading={isUpdatingUsername}
        />

        {user?.hasPassword && (
          <ChangePassword 
            onUpdate={handleUpdatePassword}
            isLoading={isUpdatingPassword}
          />
        )}

        <AccessStatusSection 
          permissions={user?.permissions} 
          trialEndsAt={user?.trialEndsAt}
          userEmail={user?.email}
          subscriptionType={user?.subscriptionStatus}
          planName={user?.planName}
        />
      </div>
    </div>
  );
}