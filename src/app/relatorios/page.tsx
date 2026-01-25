"use client";

import { useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PremiumLock } from "@/components/ui/PremiumLock";

import { ExpenseByCategoryChart } from "@/components/reports/ExpenseByCategoryChart";
import { BudgetVsActualChart } from "@/components/reports/BudgetVsActualChart";
import { IncomeVsExpenseChart } from "@/components/reports/IncomeVsExpenseChart";
import { NetWorthEvolutionChart } from "@/components/reports/NetWorthEvolutionChart";
import { Income, Expense } from "@/types/personal-finance";
import styles from "./relatorios.module.css";

const RelatoriosPage = () => {
  // 1. TODOS os hooks são declarados no topo, incondicionalmente.
  const { data: session, status } = useSession();
  const permissions = session?.user?.permissions;
  
  const [selectedYear] = useState(new Date().getFullYear());
  const reportContainerRef = useRef<HTMLElement>(null);

  const { data: yearIncomes = [], isLoading: isLoadingIncomes } = useQuery<Income[]>({
    queryKey: ['incomes', selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/incomes?year=${selectedYear}`);
      if (!response.ok) throw new Error("Network response was not ok for incomes");
      return response.json();
    },
    enabled: permissions?.isPremium,
  });

  const { data: yearExpenses = [], isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ['expenses', selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/expenses?year=${selectedYear}`);
      if (!response.ok) throw new Error("Network response was not ok for expenses");
      return response.json();
    },
    enabled: permissions?.isPremium,
  });
  
  const monthlyChartData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return months.map(monthIndex => {
      const monthName = monthNames[monthIndex];
      const monthlyIncomes = yearIncomes.filter(i => new Date(i.date).getMonth() === monthIndex).reduce((s, i) => s + Number(i.amount), 0);
      const monthlyExpenses = yearExpenses.filter(e => new Date(e.dataVencimento).getMonth() === monthIndex).reduce((s, e) => s + Number(e.valor), 0);
      return { month: monthName, Receita: monthlyIncomes, Despesa: monthlyExpenses };
    });
  }, [yearIncomes, yearExpenses]);

  // 2. As verificações e retornos antecipados vêm DEPOIS dos hooks.
  const isLoading = status === 'loading' || isLoadingIncomes || isLoadingExpenses;

  if (isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}><p>Carregando...</p></div>
      </main>
    );
  }

  if (!permissions?.isPremium) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <PremiumLock 
            title="Relatórios Detalhados"
            message="Acesse análises visuais sobre sua evolução financeira, compare receitas vs. despesas, e entenda para onde seu dinheiro está indo. Exclusivo para assinantes PRO."
          />
        </div>
      </main>
    );
  }

  const handleDownloadReport = () => {
    // ... (função de download permanece a mesma)
  };

  // 3. A renderização principal acontece no final.
  return (
    <main className={styles.page}>
      <Link href="/dashboard?tab=pessoal" className={styles.backLink}>
        &larr; Voltar para Finanças Pessoais
      </Link>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Relatórios de Finanças Pessoais</h1>
            <p className={styles.subtitle}>
              Analise suas despesas e acompanhe sua saúde financeira.
            </p>
          </div>
          <Button onClick={handleDownloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Baixar Relatório
          </Button>
        </header>

        <section ref={reportContainerRef} className={styles.chartsGrid}>
          <NetWorthEvolutionChart />
          <ExpenseByCategoryChart />
          <BudgetVsActualChart />
          <IncomeVsExpenseChart data={monthlyChartData} />
        </section>
      </div>
    </main>
  );
};

export default RelatoriosPage;