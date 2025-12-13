import React from 'react';
import { TrendingUp, Target, AlertTriangle } from 'lucide-react';
import styles from './BudgetSummary.module.css';
import { Category } from '@/types/personal-finance';

interface BudgetSummaryProps {
  categories: Category[];
  totalIncome: number;
  totalPercentage: number;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({ 
  categories,
  totalIncome,
  totalPercentage 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalAllocated = categories.reduce((sum, category) => sum + category.amount, 0);
  const remainingAmount = totalIncome - totalAllocated;

  const getStatus = () => {
    if (totalPercentage === 100) return { icon: <Target className={`${styles.statusIcon} ${styles.success}`} />, colorClass: styles.success, title: 'Orçamento Balanceado', description: 'Sua distribuição está perfeita! Todos os 100% da renda foram alocados.' };
    if (totalPercentage > 100) return { icon: <AlertTriangle className={`${styles.statusIcon} ${styles.destructive}`} />, colorClass: styles.destructive, title: 'Orçamento Excedido', description: `Você está alocando ${totalPercentage}% da sua renda. Reduza ${totalPercentage - 100}% para balancear.` };
    return { icon: <TrendingUp className={`${styles.statusIcon} ${styles.warning}`} />, colorClass: styles.warning, title: 'Orçamento Incompleto', description: `Você ainda tem ${100 - totalPercentage}% da sua renda para alocar.` };
  };

  const status = getStatus();

  const essentialCategoryName = 'Despesas Essenciais';
  const essentialCategory = categories.find(c => c.name === essentialCategoryName);
  const plannedEssentialAmount = essentialCategory ? essentialCategory.amount : 0;
  
  // Corrigido: Obter o gasto real apenas para a categoria de despesas essenciais
  const actualEssentialSpending = essentialCategory ? (essentialCategory.actualSpending || 0) : 0;

  // A lógica de "excedido" agora compara o gasto real da categoria com o planejado para ela
  const essentialSpendingExceeded = actualEssentialSpending > plannedEssentialAmount && plannedEssentialAmount > 0;
  const exceededAmount = actualEssentialSpending - plannedEssentialAmount;

  return (
    <div className={styles.wrapper}>
      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <div className={styles.cardContent}>
            <div className={styles.cardFlex}>
              <div className={`${styles.iconWrapper} ${styles.primary}`}>
                <TrendingUp className={`${styles.icon} ${styles.primary}`} />
              </div>
              <div className={styles.textWrapper}>
                <p className={styles.cardLabel}>Renda Total</p>
                <p className={styles.cardValue}>{formatCurrency(totalIncome)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardContent}>
            <div className={styles.cardFlex}>
              <div className={`${styles.iconWrapper} ${styles.success}`}>
                <Target className={`${styles.icon} ${styles.success}`} />
              </div>
              <div className={styles.textWrapper}>
                <p className={styles.cardLabel}>Total Alocado</p>
                <p className={styles.cardValue}>{formatCurrency(totalAllocated)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardContent}>
            <div className={styles.cardFlex}>
              <div className={`${styles.iconWrapper} ${remainingAmount >= 0 ? styles.success : styles.destructive}`}>
                {remainingAmount >= 0 ? <TrendingUp className={`${styles.icon} ${styles.success}`} /> : <AlertTriangle className={`${styles.icon} ${styles.destructive}`} />}
              </div>
              <div className={styles.textWrapper}>
                <p className={styles.cardLabel}>{remainingAmount >= 0 ? 'Disponível' : 'Excesso'}</p>
                <p className={`${styles.cardValue} ${remainingAmount >= 0 ? styles.success : styles.destructive}`}>{formatCurrency(Math.abs(remainingAmount))}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${styles.statusCard} ${status.colorClass}`}>
        <div className={styles.cardContent}>
          <div className={styles.statusFlex}>
            {status.icon}
            <div className={styles.statusTextWrapper}>
              <p className={styles.statusTitle}>{status.title}</p>
              <p className={styles.statusDescription}>{status.description}</p>
            </div>
          </div>
        </div>
      </div>

      {essentialSpendingExceeded && (
        <div className={`${styles.statusCard} ${styles.destructive}`}>
          <div className={styles.cardContent}>
            <div className={styles.statusFlex}>
              <AlertTriangle className={`${styles.statusIcon} ${styles.destructive}`} />
              <div className={styles.statusTextWrapper}>
                <p className={styles.statusTitle}>Gastos Essenciais Excedidos</p>
                <p className={styles.statusDescription}>
                  Você ultrapassou o valor planejado para despesas essenciais em {formatCurrency(exceededAmount)}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {categories.length > 0 && totalIncome > 0 && (
        <div className={styles.breakdownCard}>
          <div className={styles.breakdownHeader}>
            <h4 className={styles.breakdownTitle}>Distribuição por Categoria</h4>
          </div>
          <div className={styles.breakdownContent}>
            {categories.map((category) => (
              <div key={category.id} className={styles.breakdownItem}>
                <div className={styles.itemHeader}>
                  <span className={styles.itemName}>{category.name}</span>
                  <div>
                    <span className={styles.itemAmount}>{formatCurrency(category.amount)}</span>
                    <span className={styles.itemPercentage}>({category.percentage}%)</span>
                  </div>
                </div>
                <div className={styles.progressBar}>
                  <div style={{ width: `${category.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};