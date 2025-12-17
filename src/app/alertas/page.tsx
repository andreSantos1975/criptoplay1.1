'use client';

import { useState } from 'react';
import styles from './alertas.module.css';
import AlertForm from '@/components/alerts/AlertForm/AlertForm';
import AlertList from '@/components/alerts/AlertList/AlertList';
import { useAlerts } from '@/hooks/useAlerts';
import { useBudgetCategories } from '@/hooks/useBudget';
import { Alert } from '@prisma/client';
import Link from 'next/link'; // Import Link

const AlertasPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  
  const { data: alerts, isLoading: isLoadingAlerts, error: errorAlerts } = useAlerts();
  const { data: budgetCategories, isLoading: isLoadingCategories, error: errorCategories } = useBudgetCategories();

  const handleOpenModal = () => {
    setEditingAlert(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAlert(null); // Ensure editing alert is cleared on close
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
        <button onClick={handleOpenModal} className={styles.addButton}>+ Novo Alerta</button>
      </header>
      <main className={styles.mainContent}>
        {renderContent()}
      </main>

      {isModalOpen && <AlertForm onClose={handleCloseModal} alertToEdit={editingAlert} />}
    </div>
  );
};

export default AlertasPage;
