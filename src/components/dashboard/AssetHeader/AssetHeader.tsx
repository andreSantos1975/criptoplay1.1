
import React from 'react';
import styles from './AssetHeader.module.css';

interface AssetHeaderProps {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  brlRate: number;
}

const formatAsBRL = (value: number) => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
};

const AssetHeader: React.FC<AssetHeaderProps> = ({ symbol, price, open, high, low, brlRate }) => {
  const priceInBRL = price * brlRate;
  const openInBRL = open * brlRate;
  const highInBRL = high * brlRate;
  const lowInBRL = low * brlRate;

  const changeInBRL = priceInBRL - openInBRL;
  const changePercent = open !== 0 ? ((price - open) / open) * 100 : 0;
  const isPositive = changeInBRL >= 0;

  const calculatePrecision = (value: number) => {
    if (value === 0) return 4;
    const absValue = Math.abs(value);
    const logValue = Math.floor(Math.log10(absValue));
    // Adjust precision for BRL values
    return logValue < 0 ? -logValue + 2 : 2;
  };

  const changePrecision = calculatePrecision(changeInBRL);

  return (
    <div className={styles.headerContainer}>
      <div className={styles.symbolInfo}>
        <h2 className={styles.symbol}>{symbol}</h2>
        <p className={styles.price}>{formatAsBRL(priceInBRL)}</p>
        <p className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
          {formatAsBRL(changeInBRL)} ({changePercent.toFixed(2)}%)
        </p>
      </div>
      <div className={styles.marketInfo}>
        <div className={styles.infoItem}>
          <span className={styles.label}>Abertura</span>
          <span className={styles.value}>{formatAsBRL(openInBRL)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Máxima</span>
          <span className={styles.value}>{formatAsBRL(highInBRL)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Mínima</span>
          <span className={styles.value}>{formatAsBRL(lowInBRL)}</span>
        </div>
      </div>
    </div>
  );
};

export default AssetHeader;
