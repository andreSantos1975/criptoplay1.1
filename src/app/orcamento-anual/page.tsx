"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import styles from './orcamento-anual.module.css';
import { useMemo } from 'react';
import { Income } from '@/types/personal-finance';

interface Category {
  id: string;
  name: string;
  percentage: number;
}

interface BudgetData {
  categories: Category[];
}

const fetchBudget = async (): Promise<BudgetData> => {
  const response = await fetch('/api/budget');
  if (!response.ok) {
    throw new Error('Failed to fetch budget');
  }
  const data = await response.json();
  // The API might return null if no budget is saved
  return data || { categories: [] };
};

const fetchIncomes = async (): Promise<Income[]> => {
  const response = await fetch("/api/incomes");
  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
};

const OrcamentoAnualPage = () => {
  const { data: budget, isLoading: isLoadingBudget, isError: isErrorBudget } = useQuery<BudgetData>({
    queryKey: ['budget'],
    queryFn: fetchBudget,
  });

  const { data: incomes = [], isLoading: isLoadingIncomes, isError: isErrorIncomes } = useQuery<Income[]>({
    queryKey: ['incomes'],
    queryFn: fetchIncomes,
  });

  const totalIncome = useMemo(() => {
    if (!incomes) return 0;
    return incomes.reduce((sum, i) => sum + i.amount, 0);
  }, [incomes]);

  const expenseCategories = useMemo(() => {
    if (!budget) return [];
    return budget.categories.filter(
      (category) =>
        category.name !== 'Investimentos' && category.name !== 'Reserva Financeira'
    );
  }, [budget]);

  const savingsAndInvestmentsCategories = useMemo(() => {
    if (!budget) return [];
    return budget.categories.filter(
      (category) =>
        category.name === 'Investimentos' || category.name === 'Reserva Financeira'
    );
  }, [budget]);

  const totalAnnualExpense = useMemo(() => {
    if (!expenseCategories || !totalIncome) return 0;
    const totalExpensePercentage = expenseCategories.reduce((sum, cat) => sum + cat.percentage, 0);
    return totalIncome * (totalExpensePercentage / 100) * 12;
  }, [expenseCategories, totalIncome]);

  const totalAnnualSavingsAndInvestments = useMemo(() => {
    if (!savingsAndInvestmentsCategories || !totalIncome) return 0;
    const totalSavingsPercentage = savingsAndInvestmentsCategories.reduce((sum, cat) => sum + cat.percentage, 0);
    return totalIncome * (totalSavingsPercentage / 100) * 12;
  }, [savingsAndInvestmentsCategories, totalIncome]);

  const isLoading = isLoadingBudget || isLoadingIncomes;
  const isError = isErrorBudget || isErrorIncomes;

  return (
    <div className={styles.container}>
      <Link href="/dashboard?tab=pessoal&subtab=movimentacoes" className={styles.backLink}>
        &larr; Voltar para Movimentações
      </Link>
      <h1 className={styles.title}>Orçamento Anual</h1>

      {isLoading && <p>Carregando dados...</p>}
      {isError && <p>Erro ao carregar dados.</p>}

      {!isLoading && !isError && (
        <>
          <div className={styles.summary}>
            <h2>Projeção Anual</h2>
            <p>Renda Mensal Atual: R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p>Gasto Anual Projetado: R$ {totalAnnualExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p>Poupança e Investimento Anual Projetado: R$ {totalAnnualSavingsAndInvestments.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>

          {expenseCategories.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h2>Projeção Anual de Despesas</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Porcentagem Mensal</th>
                    <th>Gasto Mensal Estimado</th>
                    <th>Gasto Anual Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseCategories.map((category) => {
                    const monthlyAmount = (totalIncome * category.percentage) / 100;
                    const annualAmount = monthlyAmount * 12;
                    return (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.percentage}%</td>
                        <td>R$ {monthlyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>R$ {annualAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {savingsAndInvestmentsCategories.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h2>Projeção Anual de Poupança e Investimentos</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Porcentagem Mensal</th>
                    <th>Valor Mensal Estimado</th>
                    <th>Valor Anual Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsAndInvestmentsCategories.map((category) => {
                    const monthlyAmount = (totalIncome * category.percentage) / 100;
                    const annualAmount = monthlyAmount * 12;
                    return (
                      <tr key={category.id}>
                        <td>{category.name}</td>
                        <td>{category.percentage}%</td>
                        <td>R$ {monthlyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>R$ {annualAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrcamentoAnualPage;