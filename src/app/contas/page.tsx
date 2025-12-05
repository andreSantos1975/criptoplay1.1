
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './contas.module.css';
import { AccountCardManagement } from '@/components/finance/AccountCardManagement/AccountCardManagement';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Funções de fetch para os dados
const fetchBankAccounts = async () => {
  const res = await fetch('/api/accounts');
  if (!res.ok) {
    throw new Error('Falha ao buscar contas bancárias');
  }
  return res.json();
};

const fetchCreditCards = async () => {
  const res = await fetch('/api/credit-cards');
  if (!res.ok) {
    throw new Error('Falha ao buscar cartões de crédito');
  }
  return res.json();
};

export default function ContasPage() {
  const { data: bankAccounts, isLoading: isLoadingAccounts, error: errorAccounts } = useQuery({
    queryKey: ['bankAccounts'],
    queryFn: fetchBankAccounts,
  });

  const { data: creditCards, isLoading: isLoadingCards, error: errorCards } = useQuery({
    queryKey: ['creditCards'],
    queryFn: fetchCreditCards,
  });

  const isLoading = isLoadingAccounts || isLoadingCards;
  const error = errorAccounts || errorCards;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/dashboard?tab=pessoal" className={styles.backLink}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Finanças Pessoais
        </Link>
        <h1>Gestão de Contas e Cartões</h1>
        <p>Adicione e gerencie suas contas bancárias e cartões de crédito.</p>
      </header>

      {isLoading && <p>Carregando...</p>}
      {error && <p>Ocorreu um erro: {(error as Error).message}</p>}
      
      {!isLoading && !error && (
        <AccountCardManagement 
          bankAccounts={bankAccounts || []} 
          creditCards={creditCards || []} 
        />
      )}
    </div>
  );
}
