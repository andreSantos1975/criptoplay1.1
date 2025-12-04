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
          <CardTitle className={styles.cardTitle}>Despesas: Orçamento vs Gasto</CardTitle>
          <span className={styles.icon}>💲</span>
        </CardHeader>
        <CardContent>
          <div className={styles.value}>{formatCurrency(summary.totalGeral)}</div>
          <p className={styles.description}>
            Gasto total de {summary.countPagos + summary.countPendentes} despesas.
          </p>
          <p className={`${styles.description} ${summary.remainingTotalExpenses < 0 ? styles.negative : styles.positive}`}>
            {summary.remainingTotalExpenses >= 0
              ? `${formatCurrency(summary.remainingTotalExpenses)} restantes do orçamento de ${formatCurrency(summary.allocatedTotalExpenses)}`
              : `${formatCurrency(Math.abs(summary.remainingTotalExpenses))} acima do orçamento de ${formatCurrency(summary.allocatedTotalExpenses)}`}
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

      {summary.budgetedEssential > 0 && (
        <Card className={`${styles.summaryCard} ${summary.totalGeral > summary.budgetedEssential ? styles.pendingCard : styles.paidCard}`}>
          <CardHeader className={styles.cardHeader}>
            <CardTitle className={styles.cardTitle}>Despesas Essenciais</CardTitle>
            <span className={styles.icon}>🏠</span>
          </CardHeader>
          <CardContent>
            <div className={styles.value}>
              {formatCurrency(summary.totalGeral)}
            </div>
            <p className={`${styles.description} ${summary.totalGeral > summary.budgetedEssential ? styles.negative : styles.positive}`}>
              {summary.totalGeral > summary.budgetedEssential
                ? `${formatCurrency(summary.totalGeral - summary.budgetedEssential)} acima do orçado de ${formatCurrency(summary.budgetedEssential)}`
                : `${formatCurrency(summary.budgetedEssential - summary.totalGeral)} abaixo do orçado de ${formatCurrency(summary.budgetedEssential)}`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
