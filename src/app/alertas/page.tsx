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

  const isLoading = status === 'loading' || isLoadingAlerts || isLoadingCategories;

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
  if (status === 'authenticated' && !permissions?.hasActiveSubscription) {
    return (
      <div className={styles.container}>
        <PremiumLock 
          title="Alertas: Recurso para Assinantes"
          message="Crie e gerencie alertas personalizados para não perder nenhuma oportunidade. Obtenha acesso com sua assinatura."
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
          >
            + Novo Alerta
          </button>
        </div>

      </header>
      <main className={styles.mainContent}>
        {renderContent()}
      </main>

      {isModalOpen && <AlertForm onClose={handleCloseModal} alertToEdit={editingAlert} />}
    </div>
  );
};

export default AlertasPage;
