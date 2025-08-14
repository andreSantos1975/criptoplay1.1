"use client";

import { useQuery } from "@tanstack/react-query";
import styles from './MarketData.module.css';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';

interface MarketDataItemProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
}

const MarketDataItem = ({ title, value, change, isPositive }: MarketDataItemProps) => (
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

const fetchGlobalMarketData = async () => {
  const response = await fetch('https://api.coingecko.com/api/v3/global');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export const MarketData = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['globalMarketData'],
    queryFn: fetchGlobalMarketData,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.container}>Error fetching data</div>;
  }

  const marketData = data.data;
  const marketCap = marketData.total_market_cap.usd;
  const marketCapChange = marketData.market_cap_change_percentage_24h_usd;
  const volume = marketData.total_volume.usd;
  const btcDominance = marketData.market_cap_percentage.btc;

  return (
    <div className={styles.container}>
      <MarketDataItem
        title="Market Cap"
        value={`${(marketCap / 1e12).toFixed(2)}T`}
        change={`${marketCapChange.toFixed(2)}%`}
        isPositive={marketCapChange >= 0}
      />
      <MarketDataItem
        title="24h Volume"
        value={`${(volume / 1e9).toFixed(2)}B`}
        change=""
        isPositive={true}
      />
      <MarketDataItem
        title="BTC Dominance"
        value={`${btcDominance.toFixed(2)}%`}
        change=""
        isPositive={true}
      />
    </div>
  );
};