"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { ExpenseByCategoryChart } from "@/components/reports/ExpenseByCategoryChart";
import { BudgetVsActualChart } from "@/components/reports/BudgetVsActualChart";
import { IncomeVsExpenseChart } from "@/components/reports/IncomeVsExpenseChart";
import { NetWorthEvolutionChart } from "@/components/reports/NetWorthEvolutionChart";
import { Income, Expense } from "@/types/personal-finance";
import styles from "./relatorios.module.css";

const RelatoriosPage = () => {
  const [selectedYear] = useState(new Date().getFullYear());

  // Fetching all incomes for the selected year
  const { data: yearIncomes = [], isLoading: isLoadingIncomes } = useQuery<Income[]>({
    queryKey: ['incomes', selectedYear],
    queryFn: async () => {
      // Assuming the API can return all incomes for a year.
      // If not, this needs to be adjusted.
      const response = await fetch(`/api/incomes?year=${selectedYear}`);
      if (!response.ok) throw new Error("Network response was not ok for incomes");
      return response.json();
    },
  });

  // Fetching all expenses for the selected year
  const { data: yearExpenses = [], isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ['expenses', selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/expenses?year=${selectedYear}`);
      if (!response.ok) throw new Error("Network response was not ok for expenses");
      return response.json();
    },
  });

  const monthlyChartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i); // 0-11
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    return months.map(monthIndex => {
      const monthName = monthNames[monthIndex];

      const monthlyIncomes = yearIncomes
        .filter(income => new Date(income.date).getMonth() === monthIndex)
        .reduce((sum, income) => sum + Number(income.amount), 0);

      const monthlyExpenses = yearExpenses
        .filter(expense => new Date(expense.dataVencimento).getMonth() === monthIndex)
        .reduce((sum, expense) => sum + Number(expense.valor), 0);

      return {
        month: monthName,
        Receita: monthlyIncomes,
        Despesa: monthlyExpenses,
      };
    });
  }, [yearIncomes, yearExpenses]);

  const isLoading = isLoadingIncomes || isLoadingExpenses;

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
          {/* Now passing the required data prop */}
          <IncomeVsExpenseChart data={isLoading ? [] : monthlyChartData} />
        </section>
      </div>
    </main>
  );
};

export default RelatoriosPage;
