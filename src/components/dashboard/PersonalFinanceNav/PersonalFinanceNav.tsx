import React from 'react';
import Link from 'next/link';
import styles from './PersonalFinanceNav.module.css';
import { Income, Expense } from '@/types/personal-finance';

interface PersonalFinanceNavProps {
  activeTab: string;
  incomes: Income[];
  expenses: Expense[];
}

export const PersonalFinanceNav: React.FC<PersonalFinanceNavProps> = ({ activeTab, incomes, expenses }) => {

  const handleDownload = () => {
    const headers = [
      'Tipo',
      'Descrição/Categoria',
      'Valor',
      'Data',
    ];

    const incomeRows = incomes.map(item => ([
      'Renda',
      item.description,
      `R$ ${item.amount.toFixed(2)}`,
      new Date(item.date).toLocaleDateString('pt-BR'),
    ]));

    const expenseRows = expenses.map(item => ([
      'Despesa',
      item.categoria,
      `R$ ${item.valor.toFixed(2)}`,
      new Date(item.dataVencimento).toLocaleDateString('pt-BR'),
    ]));

    const allRows = [headers, ...incomeRows, ...expenseRows];
    const csvContent = "data:text/csv;charset=utf-8," 
      + allRows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const date = new Date();
    const monthName = date.toLocaleString('pt-BR', { month: 'long' });
    const year = date.getFullYear();
    link.setAttribute("download", `relatorio_financeiro_${monthName}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <nav className={styles.nav}>
      <Link 
        href="/dashboard?tab=pessoal&subtab=movimentacoes"
        className={`${styles.button} ${activeTab === 'movimentacoes' ? styles.active : ''}`}
      >
        Movimentações
      </Link>
      <Link 
        href="/dashboard?tab=pessoal&subtab=orcamento"
        className={`${styles.button} ${activeTab === 'orcamento' ? styles.active : ''}`}
      >
        Orçamento
      </Link>
      <button onClick={handleDownload} className={`${styles.button} ${styles.downloadButton}`}>
        Download CSV
      </button>
    </nav>
  );
};
