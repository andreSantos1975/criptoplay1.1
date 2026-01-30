import React from 'react';
import styles from './AssetHeader.module.css';

interface AssetHeaderProps {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  exchangeRate?: number; // Taxa de câmbio opcional para conversão para BRL
}

const formatCurrency = (value: number, symbol: string, exchangeRate?: number) => {
  // Se o par NÃO for BRL e a taxa de câmbio for fornecida, converte para BRL
  if (!symbol.endsWith('BRL') && exchangeRate && exchangeRate > 0) {
    const convertedValue = value * exchangeRate;
    return convertedValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2, // Em BRL, 2 casas decimais são suficientes
    });
  }

  // Lógica original: formata BRL diretamente ou USDT (dólar) como fallback
  const isUsdtPair = symbol.endsWith('USDT');
  const currency = isUsdtPair ? 'USD' : 'BRL';
  const locale = isUsdtPair ? 'en-US' : 'pt-BR';
  const minDigits = isUsdtPair ? 2 : 2; // Ajuste para BRL
  const maxDigits = isUsdtPair ? 8 : 2; // Ajuste para BRL

  return value.toLocaleString(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  });
};

const AssetHeader: React.FC<AssetHeaderProps> = ({ symbol, price, open, high, low, exchangeRate }) => {
  const change = price - open;
  const changePercent = open !== 0 ? ((price - open) / open) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className={styles.headerContainer}>
      <div className={styles.symbolInfo}>
        <h2 className={styles.symbol}>{symbol}</h2>
        <p className={styles.price}>{formatCurrency(price, symbol, exchangeRate)}</p>
        <p className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
          {formatCurrency(change, symbol, exchangeRate)} ({changePercent.toFixed(2)}%)
        </p>
      </div>
      <div className={styles.marketInfo}>
        <div className={styles.infoItem}>
          <span className={styles.label}>Abertura</span>
          <span className={styles.value}>{formatCurrency(open, symbol, exchangeRate)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Máxima</span>
          <span className={styles.value}>{formatCurrency(high, symbol, exchangeRate)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.label}>Mínima</span>
          <span className={styles.value}>{formatCurrency(low, symbol, exchangeRate)}</span>
        </div>
      </div>
    </div>
  );
};

export default AssetHeader;
