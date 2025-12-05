
import React from 'react';
import styles from './AssetHeader.module.css';

interface AssetHeaderProps {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
}

const formatAsBRL = (value: number) => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
};

const AssetHeader: React.FC<AssetHeaderProps> = ({ symbol, price, open, high, low }) => {
  const change = price - open;
  const changePercent = open !== 0 ? ((price - open) / open) * 100 : 0;
  const isPositive = change >= 0;

  

  

  return (
    <div className={styles.headerContainer}>
      <div className={styles.symbolInfo}>
        <h2 className={styles.symbol}>{symbol}</h2>
        <p className={styles.price}>{formatAsBRL(price)}</p>
        <p className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
          {formatAsBRL(change)} ({changePercent.toFixed(2)}%)
        </p>
      </div>
      <div className={styles.marketInfo}>
        <div className={styles.infoItem}>
          <span className={styles.label}>Abertura</span>
          <span className={styles.value}>{formatAsBRL(open)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Máxima</span>
          <span className={styles.value}>{formatAsBRL(high)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Mínima</span>
          <span className={styles.value}>{formatAsBRL(low)}</span>
        </div>
      </div>
    </div>
  );
};

export default AssetHeader;
