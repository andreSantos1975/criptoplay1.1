// src/components/RankingList/RankingList.tsx
'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './RankingList.module.css';
import { RankingPodium } from './RankingPodium';

interface Trader {
  id: string;
  nickname: string;
  avatar: string;
  roi: number;
  profit: number;
  trades: number;
  winRate: number;
  badges: string[];
  position: number;
  isCurrentUser: boolean;
  plan: string;
}

interface RankingResponse {
  traders: Trader[];
  currentUser: Trader | null;
  metrics: {
    totalTraders: number;
    avgRoi: number;
    avgWinRate: number;
    topTraderName: string;
    topTraderRoi: number;
  };
}

const fetchRanking = async (period: string = '30d'): Promise<RankingResponse> => {
  const res = await fetch(`/api/ranking?period=${period}`);
  if (!res.ok) {
    throw new Error('Falha ao buscar o ranking.');
  }
  return res.json();
};

const formatPercentage = (value: number) => {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

export const RankingList: React.FC = () => {
  const [period, setPeriod] = useState('30d');
  
  const { data, isLoading, error } = useQuery<RankingResponse>({
    queryKey: ['ranking', period],
    queryFn: () => fetchRanking(period),
    refetchInterval: 60000, 
  });

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Calculando ranking...</p>
      </div>
    );
  }

  if (error) {
    return <div className={styles.container}>Erro ao carregar o ranking. Tente novamente mais tarde.</div>;
  }

  if (!data || data.traders.length === 0) {
    return <div className={styles.container}>Nenhum trader no ranking ainda.</div>;
  }

  const top3 = data.traders.slice(0, 3);
  const restOfList = data.traders.slice(3);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ranking Oficial</h1>
        <p className={styles.subtitle}>Os melhores traders do mês com base em ROI</p>
        
        <div className={styles.periodSelector}>
          <button 
            className={`${styles.periodBtn} ${period === '7d' ? styles.active : ''}`}
            onClick={() => setPeriod('7d')}
          >
            Semana
          </button>
          <button 
            className={`${styles.periodBtn} ${period === '30d' ? styles.active : ''}`}
            onClick={() => setPeriod('30d')}
          >
            Mês
          </button>
          <button 
            className={`${styles.periodBtn} ${period === 'all' ? styles.active : ''}`}
            onClick={() => setPeriod('all')}
          >
            Geral
          </button>
        </div>
      </div>

      <RankingPodium topTraders={top3} />

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>#</th>
              <th className={styles.th}>Trader</th>
              <th className={`${styles.th} ${styles.mobileHide}`}>Trades</th>
              <th className={`${styles.th} ${styles.mobileHide}`}>Win Rate</th>
              <th className={styles.th}>Lucro (USDT)</th>
              <th className={styles.th}>ROI</th>
            </tr>
          </thead>
          <tbody>
            {restOfList.map((trader) => (
              <tr 
                key={trader.id} 
                className={`${styles.tr} ${trader.isCurrentUser ? styles.currentUserRow : ''}`}
              >
                <td className={styles.td}>
                  <span className={styles.positionBadge}>{trader.position}</span>
                </td>
                <td className={styles.td}>
                  <div className={styles.traderCell}>
                    <Image src={trader.avatar} alt="avatar" width={32} height={32} className={styles.miniAvatar} />
                    <span className={styles.name}>{trader.nickname}</span>
                    {trader.badges.includes('proTrader') && <span title="Pro Trader">🏆</span>}
                  </div>
                </td>
                <td className={`${styles.td} ${styles.mobileHide}`}>{trader.trades}</td>
                <td className={`${styles.td} ${styles.mobileHide}`}>{trader.winRate.toFixed(1)}%</td>
                <td className={`${styles.td} ${trader.profit >= 0 ? styles.positive : styles.negative}`}>
                  {trader.profit >= 0 ? '+' : ''}{trader.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={`${styles.td} ${styles.roiCell}`}>
                  {formatPercentage(trader.roi)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.currentUser && data.currentUser.position > 3 && (
        <div className={styles.userStickyBar}>
          <div className={styles.userStickyContent}>
            <span>Sua Posição: <strong>#{data.currentUser.position}</strong></span>
            <span>ROI: <strong>{formatPercentage(data.currentUser.roi)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
