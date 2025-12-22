import { Alert, AlertStatus, AlertType, BudgetCategory } from '@prisma/client';
import styles from './AlertList.module.css';
import { useDeleteAlert } from '@/hooks/useAlerts';
import { useState, useMemo } from 'react';

interface AlertListProps {
  alerts: Alert[];
  budgetCategories: BudgetCategory[];
  onEdit: (alert: Alert) => void;
  exchangeRate?: number;
}

const getAlertTypeText = (type: AlertType) => {
  switch (type) {
    case AlertType.PRICE:
      return 'Preço de Cripto';
    case AlertType.BUDGET:
      return 'Orçamento';
    case AlertType.BILL:
      return 'Conta a Pagar';
    default:
      return 'Desconhecido';
  }
};

const AlertList = ({ alerts, budgetCategories, onEdit, exchangeRate = 1 }: AlertListProps) => {
  const deleteAlertMutation = useDeleteAlert();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categoryMap = useMemo(() => {
    return budgetCategories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  }, [budgetCategories]);

  const formatPrice = (value: number, symbol: string) => {
    const isBRLPair = symbol?.endsWith('BRL');
    // Se não for par BRL, converte usando a taxa (valor * exchangeRate)
    const finalValue = isBRLPair ? value : value * exchangeRate;

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(finalValue);
  };

  const getAlertConditionText = (alert: Alert) => {
    const config = alert.config as any;
    switch (alert.type) {
      case AlertType.PRICE:
        const formattedPrice = formatPrice(config.targetPrice || 0, config.symbol || '');
        return `${config.symbol} ${config.operator === 'gt' ? '>' : '<'} ${formattedPrice}`;
      case AlertType.BUDGET:
        const categoryName = categoryMap[config.categoryId] || 'Categoria desconhecida';
        return `${categoryName} > ${config.percentage}%`;
      case AlertType.BILL:
        return `Lembrar conta ${config.bill} ${config.reminderDays} dias antes`;
      default:
        return 'N/A';
    }
  };

  const handleDelete = (alertId: string) => {
    setDeletingId(alertId);
    deleteAlertMutation.mutate(alertId, {
      onSettled: () => {
        setDeletingId(null);
      }
    });
  };

  return (
    <div className={styles.alertList}>
      {alerts.map((alert) => (
        <div key={alert.id} className={styles.alertItem}>
          <div className={styles.alertInfo}>
            <span className={styles.alertType}>{getAlertTypeText(alert.type)}</span>
            <span className={styles.alertCondition}>{getAlertConditionText(alert)}</span>
            <span className={`${styles.alertStatus} ${styles[alert.status.toLowerCase()]}`}>
              {alert.status === AlertStatus.TRIGGERED && '🔔 '}
              {alert.status}
            </span>
            {alert.status === AlertStatus.ERROR && (
              <span className={styles.errorMessage}>
                ⚠️ Erro: Símbolo inválido ou preço indisponível. Verifique a configuração.
              </span>
            )}
          </div>
          <div className={styles.alertActions}>
            <button className={styles.editButton} onClick={() => onEdit(alert)} disabled={!!deletingId}>Editar</button>
            <button 
              className={styles.deleteButton} 
              onClick={() => handleDelete(alert.id)}
              disabled={!!deletingId}
            >
              {deletingId === alert.id ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertList;
