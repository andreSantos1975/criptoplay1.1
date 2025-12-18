'use client';

import { useState, useEffect } from 'react';
import styles from './alertas.module.css';
import AlertForm from '@/components/alerts/AlertForm/AlertForm';
import AlertList from '@/components/alerts/AlertList/AlertList';
import { useAlerts } from '@/hooks/useAlerts';
import { useBudgetCategories } from '@/hooks/useBudget';
import { useAlertNotification } from '@/hooks/useAlertNotification';
import { Alert } from '@prisma/client';
import Link from 'next/link';

const AlertasPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  const { data: alerts, isLoading: isLoadingAlerts, error: errorAlerts } = useAlerts();
  const { data: budgetCategories, isLoading: isLoadingCategories, error: errorCategories } = useBudgetCategories();
  const { notificationCount, mutate: mutateNotifications } = useAlertNotification();
  const { mutate: mutateAlerts } = useAlerts(); // Get mutate function for alerts list
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const acknowledgeNotifications = async () => {
      if (notificationCount > 0) {
        try {
          await fetch('/api/alerts/acknowledge', { method: 'POST' });
          // Re-fetch the notification count to update the UI (e.g., sidebar icon)
          mutateNotifications();
        } catch (error) {
          console.error('Failed to acknowledge notifications:', error);
        }
      }
    };

    acknowledgeNotifications();
    // We only want to run this on mount and when notificationCount changes from >0 to 0 etc.
    // The dependency array is kept minimal to avoid re-running on every notification count change during polling.
    // The main trigger is the user visiting the page.
  }, []); // Empty dependency array means it runs once on mount.

  const handleManualCheck = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/alerts/manual-trigger', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Falha ao acionar o processador de alertas.');
      }
      alert('Verificação de alertas concluída com sucesso! A lista será atualizada.');
      // Re-fetch both the alerts list and the notification count
      mutateAlerts();
      mutateNotifications();
    } catch (error) {
      console.error('Error during manual alert check:', error);
      alert('Ocorreu um erro ao verificar os alertas.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenModal = () => {
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
    if (isLoadingAlerts || isLoadingCategories) {
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
          <button onClick={handleManualCheck} className={styles.manualCheckButton} disabled={isProcessing}>
            {isProcessing ? 'Verificando...' : 'Forçar Verificação'}
          </button>
          <button onClick={handleOpenModal} className={styles.addButton}>+ Novo Alerta</button>
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
