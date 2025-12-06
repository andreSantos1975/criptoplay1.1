
import React from 'react';
import styles from './AssetHeader.module.css';

interface AssetHeaderProps {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
}

const formatCurrency = (value: number, symbol: string) => {
  const currency = symbol.endsWith('USDT') ? 'USD' : 'BRL';
  const locale = symbol.endsWith('USDT') ? 'en-US' : 'pt-BR';
  return value.toLocaleString(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 8, // Increased for low-value cryptos
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
        <p className={styles.price}>{formatCurrency(price, symbol)}</p>
        <p className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
          {formatCurrency(change, symbol)} ({changePercent.toFixed(2)}%)
        </p>
      </div>
      <div className={styles.marketInfo}>
        <div className={styles.infoItem}>
          <span className={styles.label}>Abertura</span>
          <span className={styles.value}>{formatCurrency(open, symbol)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Máxima</span>
          <span className={styles.value}>{formatCurrency(high, symbol)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Mínima</span>
          <span className={styles.value}>{formatCurrency(low, symbol)}</span>
        </div>
      </div>
    </div>
  );
};

export default AssetHeader;
