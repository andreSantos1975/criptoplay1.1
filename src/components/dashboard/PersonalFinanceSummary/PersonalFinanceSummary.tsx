import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseSummary as SummaryType } from "@/types/personal-finance";
import styles from "./PersonalFinanceSummary.module.css";

interface PersonalFinanceSummaryProps {
  summary: SummaryType;
}

export function PersonalFinanceSummary({ summary }: PersonalFinanceSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className={styles.summaryGrid}>
      <Card className={styles.summaryCard}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.cardTitle}>Total Geral (Despesas)</CardTitle>
          <span className={styles.icon}>💲</span>
        </CardHeader>
        <CardContent>
          <div className={styles.value}>{formatCurrency(summary.totalGeral)}</div>
          <p className={styles.description}>
            {summary.countPendentes + summary.countPagos} despesas no total
          </p>
        </CardContent>
      </Card>

      <Card className={`${styles.summaryCard} ${styles.pendingCard}`}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.cardTitle}>Pendentes</CardTitle>
          <span className={styles.icon}>⏰</span>
        </CardHeader>
        <CardContent>
          <div className={styles.value}>{formatCurrency(summary.totalPendentes)}</div>
          <p className={styles.description}>
            {summary.countPendentes} contas pendentes
          </p>
        </CardContent>
      </Card>

      <Card className={`${styles.summaryCard} ${styles.paidCard}`}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.cardTitle}>Pagos</CardTitle>
          <span className={styles.icon}>✔️</span>
        </CardHeader>
        <CardContent>
          <div className={styles.value}>{formatCurrency(summary.totalPagos)}</div>
          <p className={styles.description}>
            {summary.countPagos} contas pagas
          </p>
        </CardContent>
      </Card>

      <Card className={`${styles.summaryCard} ${styles.incomeCard}`}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.cardTitle}>Total de Renda</CardTitle>
          <span className={styles.icon}>💰</span>
        </CardHeader>
        <CardContent>
          <div className={styles.value}>{formatCurrency(summary.totalIncome)}</div>
          <p className={styles.description}>
            Soma de todas as suas rendas
          </p>
        </CardContent>
      </Card>

      <Card className={`${styles.summaryCard} ${styles.balanceCard}`}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.cardTitle}>Balanço</CardTitle>
          <span className={styles.icon}>📊</span>
        </CardHeader>
        <CardContent>
          <div className={`${styles.value} ${summary.balance < 0 ? styles.negative : styles.positive}`}>{formatCurrency(summary.balance)}</div>
          <p className={styles.description}>
            Renda total - Despesa total
          </p>
        </CardContent>
      </Card>

      <Card className={`${styles.summaryCard} ${styles.economyCard}`}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.cardTitle}>Economia</CardTitle>
          <span className={styles.icon}>📈</span>
        </CardHeader>
        <CardContent>
          <div className={styles.value}>{formatCurrency(summary.totalSavings)}</div>
          <p className={styles.description}>
            Economia total gerada
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
