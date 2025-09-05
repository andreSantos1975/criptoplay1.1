"use client";

import { ExpenseByCategoryChart } from "@/components/reports/ExpenseByCategoryChart";
import { BudgetVsActualChart } from "@/components/reports/BudgetVsActualChart";
import { IncomeVsExpenseChart } from "@/components/reports/IncomeVsExpenseChart";
import styles from "./relatorios.module.css";

const RelatoriosPage = () => {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Relatórios de Finanças Pessoais</h1>
          <p className={styles.subtitle}>
            Analise suas despesas e acompanhe sua saúde financeira.
          </p>
        </header>

        <section className={styles.chartsGrid}>
          <ExpenseByCategoryChart />
          <BudgetVsActualChart />
          <IncomeVsExpenseChart />
        </section>
      </div>
    </main>
  );
};

export default RelatoriosPage;
