import React from 'react';
import Image from 'next/image';
import styles from './RankingPodium.module.css';

interface Trader {
  id: string;
  nickname: string;
  avatar: string;
  roi: number;
  profit: number;
  position: number;
}

interface RankingPodiumProps {
  topTraders: Trader[];
}

export const RankingPodium: React.FC<RankingPodiumProps> = ({ topTraders }) => {
  // Garantir que temos 3 posições preenchidas, mesmo que com placeholders
  const filledTraders = [
    topTraders.find(t => t.position === 1) || null,
    topTraders.find(t => t.position === 2) || null,
    topTraders.find(t => t.position === 3) || null,
  ];

  // Removed formatCurrency function

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const renderPedestal = (trader: Trader | null, position: number) => {
    let positionClass = '';
    let rankLabel = '';

    switch (position) {
      case 1:
        positionClass = styles.firstPlace;
        rankLabel = '1º';
        break;
      case 2:
        positionClass = styles.secondPlace;
        rankLabel = '2º';
        break;
      case 3:
        positionClass = styles.thirdPlace;
        rankLabel = '3º';
        break;
    }

    if (!trader) {
      // Placeholder invisível para manter layout
      return (
        <div className={`${styles.pedestalWrapper} ${positionClass}`} style={{ opacity: 0 }}>
           <div className={styles.pedestal}></div>
        </div>
      );
    }

    return (
      <div className={`${styles.pedestalWrapper} ${positionClass}`}>
        <div className={styles.avatarContainer}>
          {position === 1 && <div className={styles.crown}>👑</div>}
          <Image
            src={trader.avatar}
            alt={trader.nickname}
            width={120}
            height={120}
            className={styles.avatar}
            unoptimized // Evita erros de otimização com SVGs externos (DiceBear)
          />
          <div className={styles.rankBadge}>{rankLabel}</div>
        </div>
        
        <div className={styles.pedestal}>
          <div className={styles.traderInfo}>
            <span className={styles.nickname}>{trader.nickname}</span>
            <span className={styles.roi}>{formatPercentage(trader.roi)}</span>
            <span className={styles.profit}>{trader.profit >= 0 ? '+' : ''}{trader.profit.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USDT</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.podiumContainer}>
      {renderPedestal(filledTraders[1], 2)} {/* 2º Lugar na Esquerda */}
      {renderPedestal(filledTraders[0], 1)} {/* 1º Lugar no Centro */}
      {renderPedestal(filledTraders[2], 3)} {/* 3º Lugar na Direita */}
    </div>
  );
};
