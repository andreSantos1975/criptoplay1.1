"use client";

import Link from "next/link";
import { ExpenseByCategoryChart } from "@/components/reports/ExpenseByCategoryChart";
import { BudgetVsActualChart } from "@/components/reports/BudgetVsActualChart";
import { IncomeVsExpenseChart } from "@/components/reports/IncomeVsExpenseChart";
import { NetWorthEvolutionChart } from "@/components/reports/NetWorthEvolutionChart";
import styles from "./relatorios.module.css";

const RelatoriosPage = () => {
  return (
    <main className={styles.page}>
      <Link href="/dashboard?tab=pessoal" className={styles.backLink}>
        &larr; Voltar para Finanças Pessoais
      </Link>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Relatórios de Finanças Pessoais</h1>
          <p className={styles.subtitle}>
            Analise suas despesas e acompanhe sua saúde financeira.
          </p>
        </header>

        <section className={styles.chartsGrid}>
          <NetWorthEvolutionChart />
          <ExpenseByCategoryChart />
          <BudgetVsActualChart />
          <IncomeVsExpenseChart />
        </section>
      </div>
    </main>
  );
};

export default RelatoriosPage;