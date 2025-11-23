"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BudgetExpenseChart } from "@/components/reports/BudgetExpenseChart";
import { IncomeVsExpenseChart } from "@/components/reports/IncomeVsExpenseChart";
import styles from "./orcamento.module.css";

// Tipos (podem ser movidos para um arquivo compartilhado)
interface BudgetCategory {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface BudgetItem {
  id: string;
  categoryId: string;
  month: number;
  amount: number;
}

// Funções de API
const fetchBudgetCategories = async (): Promise<BudgetCategory[]> => {
  const res = await fetch("/api/budget/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
};

const fetchBudgetItems = async (year: number): Promise<BudgetItem[]> => {
  const res = await fetch(`/api/budget/items?year=${year}`);
  if (!res.ok) throw new Error("Failed to fetch budget items");
  return res.json();
};

export default function OrcamentoReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<BudgetCategory[]>({
    queryKey: ["budgetCategories"],
    queryFn: fetchBudgetCategories,
  });

  const { data: items = [], isLoading: isLoadingItems } = useQuery<BudgetItem[]>({
    queryKey: ["budgetItems", year],
    queryFn: () => fetchBudgetItems(year),
  });

  const { expenseChartData, incomeVsExpenseChartData } = useMemo(() => {
    // Process data for expense pie chart
    const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
    const categoryTotals: { [name: string]: number } = {};
    expenseCategories.forEach((category) => {
      categoryTotals[category.name] = 0;
    });

    items.forEach((item) => {
      const category = categories.find((c) => c.id === item.categoryId);
      if (category && category.type === "EXPENSE") {
        categoryTotals[category.name] += item.amount;
      }
    });

    const finalExpenseData = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);

    // Process data for income vs expense bar chart
    const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const monthlyTotals = monthLabels.map(label => ({ month: label, Receita: 0, Despesa: 0 }));

    items.forEach(item => {
        const category = categories.find(c => c.id === item.categoryId);
        if (category) {
            const monthIndex = item.month - 1;
            if (category.type === 'INCOME') {
                monthlyTotals[monthIndex].Receita += item.amount;
            } else {
                monthlyTotals[monthIndex].Despesa += item.amount;
            }
        }
    });

    return { expenseChartData: finalExpenseData, incomeVsExpenseChartData: monthlyTotals };

  }, [items, categories]);

  const isLoading = isLoadingCategories || isLoadingItems;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Relatórios do Orçamento</h1>
        <div className={styles.yearSelector}>
          <button onClick={() => setYear(year - 1)}>{"<"}</button>
          <span>{year}</span>
          <button onClick={() => setYear(year + 1)}>{">"}</button>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Distribuição de Despesas Anual</h2>
          {isLoading ? (
            <p>Carregando dados do gráfico...</p>
          ) : (
            <BudgetExpenseChart data={expenseChartData} />
          )}
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Receita vs. Despesa Mensal</h2>
          {isLoading ? (
            <p>Carregando dados do gráfico...</p>
          ) : (
            <IncomeVsExpenseChart data={incomeVsExpenseChartData} />
          )}
        </div>
      </div>
    </div>
  );
}
