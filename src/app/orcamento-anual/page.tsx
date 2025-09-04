"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import styles from './orcamento-anual.module.css';

// Assuming the same Category type is used
interface Category {
  id: string;
  name: string;
  percentage: number;
  amount: number; // This is the monthly amount
}

interface BudgetData {
  income: number;
  categories: Category[];
}

const fetchBudget = async (): Promise<BudgetData> => {
  const response = await fetch('/api/budget');
  if (!response.ok) {
    throw new Error('Failed to fetch budget');
  }
  return response.json();
};

const OrcamentoAnualPage = () => {
  const { data: budget, isLoading, isError } = useQuery<BudgetData>({
    queryKey: ['budget'],
    queryFn: fetchBudget,
  });

  const totalIncome = budget?.income || 0;

  return (
    <div className={styles.container}>
      <Link href="/dashboard?tab=pessoal&subtab=movimentacoes" className={styles.backLink}>
        &larr; Voltar para Movimentações
      </Link>
      <h1 className={styles.title}>Orçamento Anual</h1>

      {isLoading && <p>Carregando orçamento...</p>}
      {isError && <p>Erro ao carregar orçamento.</p>}

      {budget && (
        <>
          <div className={styles.summary}>
            <h2>Projeção Anual Baseada na Renda Mensal</h2>
            <p>Renda Mensal Informada: R$ {totalIncome.toFixed(2)}</p>
            <p>Renda Anual Projetada: R$ {(totalIncome * 12).toFixed(2)}</p>
          </div>

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
              {budget.categories.map((category) => {
                const monthlyAmount = (totalIncome * category.percentage) / 100;
                const annualAmount = monthlyAmount * 12;
                return (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.percentage}%</td>
                    <td>R$ {monthlyAmount.toFixed(2)}</td>
                    <td>R$ {annualAmount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default OrcamentoAnualPage;