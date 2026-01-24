'use client';

import { useState } from 'react';
import styles from './alertas.module.css';
import AlertForm from '@/components/alerts/AlertForm/AlertForm';
import AlertList from '@/components/alerts/AlertList/AlertList';
import { useAlerts } from '@/hooks/useAlerts';
import { useBudgetCategories } from '@/hooks/useBudget';
import { useSubscription } from '@/hooks/useSubscription'; // Import the new hook
import { Alert } from '@prisma/client';
import Link from 'next/link';

const AlertasPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  // Fetch alerts and subscription status
  const { data: alerts, isLoading: isLoadingAlerts, error: errorAlerts } = useAlerts();
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscription();
  const { data: budgetCategories, isLoading: isLoadingCategories, error: errorCategories } = useBudgetCategories();

  // --- FEATURE GATING LOGIC ---
  const STARTER_ALERT_LIMIT = 3;
  const isStarter = subscription?.planId.startsWith('starter');
  const alertCount = alerts?.length || 0;
  const limitReached = isStarter && alertCount >= STARTER_ALERT_LIMIT;
  const isLoading = isLoadingAlerts || isLoadingSubscription || isLoadingCategories;
  // ---

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
            title={limitReached ? `Limite de ${STARTER_ALERT_LIMIT} alertas atingido para o plano Starter` : 'Criar um novo alerta'}
          >
            + Novo Alerta
          </button>
        </div>
        {limitReached && (
          <div className={styles.limitMessage}>
            <p>Você atingiu o limite de {STARTER_ALERT_LIMIT} alertas para o plano Starter.</p>
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
