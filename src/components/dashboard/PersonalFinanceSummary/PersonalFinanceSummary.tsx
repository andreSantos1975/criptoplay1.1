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
          <CardTitle className={styles.cardTitle}>Total Geral</CardTitle>
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

      <Card className={`${styles.summaryCard} ${styles.economyCard}`}>
        <CardHeader className={styles.cardHeader}>
          <CardTitle className={styles.cardTitle}>Economia</CardTitle>
          <span className={styles.icon}>📈</span>
        </CardHeader>
        <CardContent>
          <div className={styles.value}>
            {summary.countPagos > 0 ? 
              `${Math.round((summary.countPagos / (summary.countPendentes + summary.countPagos)) * 100)}%` : 
              '0%'
            }
          </div>
          <p className={styles.description}>
            Das contas foram pagas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
