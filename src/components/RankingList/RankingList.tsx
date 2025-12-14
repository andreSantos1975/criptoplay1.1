// src/components/RankingList/RankingList.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './RankingList.module.css';

interface RankingEntry {
  username: string;
  totalPnl: number;
}

const fetchRanking = async (): Promise<RankingEntry[]> => {
  const res = await fetch('/api/simulator/ranking');
  if (!res.ok) {
    throw new Error('Falha ao buscar o ranking.');
  }
  return res.json();
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const RankingList: React.FC = () => {
  const { data: ranking, isLoading, error } = useQuery<RankingEntry[]>({
    queryKey: ['simulatorRanking'],
    queryFn: fetchRanking,
    refetchInterval: 60000, // Atualiza o ranking a cada minuto
  });

  if (isLoading) {
    return <div className={styles.container}>Carregando Ranking...</div>;
  }

  if (error) {
    return <div className={styles.container}>Erro ao carregar o ranking: {error.message}</div>;
  }

  if (!ranking || ranking.length === 0) {
    return <div className={styles.container}>Nenhum trader no ranking ainda.</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Ranking de Traders</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Posição</th>
            <th className={styles.th}>Apelido</th>
            <th className={styles.th}>Lucro Total</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((entry, index) => (
            <tr key={entry.username} className={styles.tr}>
              <td className={styles.td}>{index + 1}</td>
              <td className={styles.td}>{entry.username}</td>
              <td className={`${styles.td} ${entry.totalPnl >= 0 ? styles.positive : styles.negative}`}>
                {formatCurrency(entry.totalPnl)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
