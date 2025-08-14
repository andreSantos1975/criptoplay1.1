import styles from './MarketData.module.css';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

const MarketDataItem = ({ title, value, change, isPositive }) => (
  <div className={styles.glassCard}>
    <div className={styles.itemHeader}>
      <h3 className={styles.title}>{title}</h3>
      <TrendingUp className={`${styles.icon} ${isPositive ? styles.success : styles.warning}`} />
    </div>
    <p className={styles.value}>{value}</p>
    <span className={`${styles.change} ${isPositive ? styles.success : styles.warning}`}>
      {isPositive ? <ArrowUp className={styles.arrow} /> : <ArrowDown className={styles.arrow} />}
      {change}
    </span>
  </div>
);

export const MarketData = () => {
  return (
    <div className={styles.container}>
      <MarketDataItem title="Market Cap" value="$2.1T" change="2.4%" isPositive={true} />
      <MarketDataItem title="24h Volume" value="$84.2B" change="5.1%" isPositive={true} />
      <MarketDataItem title="BTC Dominance" value="42.1%" change="0.8%" isPositive={false} />
    </div>
  );
};