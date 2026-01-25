'use client';

import { useState } from 'react';
import styles from './alertas.module.css';
import AlertForm from '@/components/alerts/AlertForm/AlertForm';
import AlertList from '@/components/alerts/AlertList/AlertList';
import { useAlerts } from '@/hooks/useAlerts';
import { useBudgetCategories } from '@/hooks/useBudget';
import { Alert } from '@prisma/client';
import Link from 'next/link';
import { useSession } from 'next-auth/react'; // Import useSession
import { PremiumLock } from '@/components/ui/PremiumLock'; // Import PremiumLock

const AlertasPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  // Obter sessão e permissões
  const { data: session, status } = useSession();
  const permissions = session?.user?.permissions;

  // Fetch alerts and budget categories
  const { data: alerts, isLoading: isLoadingAlerts, error: errorAlerts } = useAlerts();
  const { data: budgetCategories, isLoading: isLoadingCategories, error: errorCategories } = useBudgetCategories();

  // --- LÓGICA DE FEATURE GATING ATUALIZADA ---
  const FREE_TIER_ALERT_LIMIT = 1; // Limite de 1 alerta para usuários não-premium
  
  // Usuário é premium se tiver a permissão isPremium
  const isPremiumUser = permissions?.isPremium === true; 
  
  const alertCount = alerts?.length || 0;
  
  // Limite atingido se NÃO for premium E a contagem for maior ou igual ao limite free
  const limitReached = !isPremiumUser && alertCount >= FREE_TIER_ALERT_LIMIT;
  
  const isLoading = status === 'loading' || isLoadingAlerts || isLoadingCategories;
  // --- FIM DA LÓGICA DE FEATURE GATING ATUALIZADA ---

  const handleOpenModal = () => {
    if (limitReached) return; // Extra safety check
    setEditingAlert(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAlert(null);
  };

  const handleEdit = (alert: Alert) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  };

  // 4. Exibir PremiumLock se o usuário não tiver acesso, mesmo após autenticação
  if (status === 'authenticated' && !isPremiumUser) {
    return (
      <div className={styles.container}>
        <PremiumLock 
          title="Alertas de Preço: Funcionalidade Premium"
          message="Crie e gerencie alertas de preço personalizados para não perder nenhuma oportunidade. Obtenha acesso ilimitado com o plano PRO."
        />
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading) {
      return <div className={styles.placeholder}>Carregando...</div>;
    }

    if (errorAlerts || errorCategories) {
      return <div className={styles.placeholder}>Erro ao carregar os dados.</div>;
    }

    if (!alerts || alerts.length === 0) {
      return (
        <div className={styles.placeholder}>
          <p>Você ainda não tem nenhum alerta. Crie um para começar!</p>
        </div>
      );
    }

    return <AlertList alerts={alerts} budgetCategories={budgetCategories || []} onEdit={handleEdit} />;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/dashboard?tab=pessoal" className={styles.backLink}>
          ← Voltar para o Dashboard
        </Link>
        <h1>Meus Alertas</h1>
        <div className={styles.headerActions}>
          <button 
            onClick={handleOpenModal} 
            className={styles.addButton}
            disabled={limitReached}
            title={limitReached ? `Você já possui ${FREE_TIER_ALERT_LIMIT} alerta. Faça upgrade para criar mais.` : 'Criar um novo alerta'}
          >
            + Novo Alerta
          </button>
        </div>
        {limitReached && (
          <div className={styles.limitMessage}>
            <p>Você atingiu o limite de {FREE_TIER_ALERT_LIMIT} alerta para seu plano atual.</p>
            <Link href="/assinatura">Faça upgrade para o plano Pro e tenha alertas ilimitados!</Link>
          </div>
        )}
      </header>
      <main className={styles.mainContent}>
        {renderContent()}
      </main>

      {isModalOpen && <AlertForm onClose={handleCloseModal} alertToEdit={editingAlert} />}
    </div>
  );
};

export default AlertasPage;
