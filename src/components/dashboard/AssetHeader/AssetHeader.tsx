
import React from 'react';
import styles from './AssetHeader.module.css';

interface AssetHeaderProps {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
}

const formatAsUSD = (value: number) => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6, // Show more precision for crypto
  });
};

const AssetHeader: React.FC<AssetHeaderProps> = ({ symbol, price, open, high, low }) => {
  const change = price - open;
  const changePercent = open !== 0 ? (change / open) * 100 : 0;
  const isPositive = change >= 0;

  const calculatePrecision = (value: number) => {
    if (value === 0) return 4;
    const absValue = Math.abs(value);
    const logValue = Math.floor(Math.log10(absValue));
    return logValue < 0 ? -logValue + 2 : 4;
  };

  const changePrecision = calculatePrecision(change);

  return (
    <div className={styles.headerContainer}>
      <div className={styles.symbolInfo}>
        <h2 className={styles.symbol}>{symbol}</h2>
        <p className={styles.price}>{formatAsUSD(price)}</p>
        <p className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
          {change.toFixed(changePrecision)} ({changePercent.toFixed(2)}%)
        </p>
      </div>
      <div className={styles.marketInfo}>
        <div className={styles.infoItem}>
          <span className={styles.label}>Abertura</span>
          <span className={styles.value}>{formatAsUSD(open)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Máxima</span>
          <span className={styles.value}>{formatAsUSD(high)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Mínima</span>
          <span className={styles.value}>{formatAsUSD(low)}</span>
        </div>
      </div>
    </div>
  );
};

export default AssetHeader;
