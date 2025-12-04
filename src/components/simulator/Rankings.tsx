"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './Rankings.module.css';

// Tipagem para os dados do ranking
interface RankingData {
  userId: string;
  dailyPercentageGain?: number;
  _avg?: {
    dailyPercentageGain: number | null;
  };
  user: {
    name: string | null;
    image: string | null;
  };
}

// Função para buscar os dados do ranking
const fetchRanking = async (period: 'daily' | 'monthly'): Promise<RankingData[]> => {
  const res = await fetch(`/api/simulator/rankings?period=${period}`);
  if (!res.ok) {
    throw new Error('Falha ao buscar ranking.');
  }
  return res.json();
};

export const Rankings = () => {
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');

  const { data, isLoading, error } = useQuery<RankingData[], Error>({
    queryKey: ['rankings', period],
    queryFn: () => fetchRanking(period),
  });

  const getScore = (item: RankingData) => {
    const score = period === 'daily' 
      ? item.dailyPercentageGain 
      : item._avg?.dailyPercentageGain;
    return score?.toFixed(2) ?? '0.00';
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Ranking</h2>
        <div className={styles.tabs}>
          <button
            onClick={() => setPeriod('daily')}
            className={`${styles.tab} ${period === 'daily' ? styles.active : ''}`}
          >
            Diário
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`${styles.tab} ${period === 'monthly' ? styles.active : ''}`}
          >
            Mensal
          </button>
        </div>
      </div>

      {isLoading && <p>Carregando ranking...</p>}
      {error && <p className={styles.error}>Não foi possível carregar o ranking.</p>}
      
      {data && data.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} style={{ width: '50px' }}>#</th>
              <th className={styles.th}>Jogador</th>
              <th className={styles.th} style={{ textAlign: 'right' }}>Performance (%)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.userId}>
                <td className={styles.td}>{index + 1}</td>
                <td className={styles.td}>{item.user?.name ?? 'Anônimo'}</td>
                <td className={styles.td} style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {getScore(item)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data && data.length === 0 && (
        <p>Ainda não há dados para o ranking {period === 'daily' ? 'de hoje' : 'deste mês'}.</p>
      )}
    </div>
  );
};