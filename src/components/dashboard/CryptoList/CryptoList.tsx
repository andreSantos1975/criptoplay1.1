"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown } from "lucide-react";
import styles from "./CryptoList.module.css";

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

const fetchCryptoData = async (): Promise<CryptoData[]> => {
  const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  if (!response.ok) {
    throw new Error("Erro ao buscar dados");
  }
  const data = await response.json();

  const coinNameMap: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    SOL: "Solana",
    USDC: "USD Coin",
    FDUSD: "First Digital USD",
  };

  return data
    .filter((crypto: any) => crypto.symbol.endsWith("USDT"))
    .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, 5)
    .map((crypto: any) => {
      const baseAsset = crypto.symbol.replace("USDT", "");
      const name = coinNameMap[baseAsset] || baseAsset;
      return {
        id: baseAsset,
        name,
        symbol: baseAsset,
        image: `https://coinicons-api.vercel.app/api/icon/${baseAsset.toLowerCase()}`,
        current_price: parseFloat(crypto.lastPrice),
        price_change_percentage_24h: parseFloat(crypto.priceChangePercent),
        total_volume: parseFloat(crypto.volume),
      };
    });
};

export const CryptoList = () => {
  const { data: cryptos, isLoading, error } = useQuery<CryptoData[]>({
    queryKey: ["cryptos"],
    queryFn: fetchCryptoData,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return <div className={styles.glassCard}>Carregando...</div>;
  }

  if (error) {
    return <div className={styles.glassCard}>Erro ao buscar dados</div>;
  }

  return (
    <div className={styles.glassCard}>
      <h2 className={styles.title}>Top Cryptocurrencies by Volume (Binance)</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeader}>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Price</th>
              <th className={styles.th}>24h Change</th>
              <th className={styles.th}>Volume</th>
            </tr>
          </thead>
          <tbody>
            {cryptos?.map((crypto) => (
              <tr key={crypto.id} className={styles.tableRow}>
                <td className={styles.td}>
                  <div className={styles.nameCell}>
                    <img
                      src={crypto.image}
                      alt={crypto.name}
                      className={styles.cryptoImage}
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div>
                      <p className={styles.cryptoName}>{crypto.name}</p>
                      <p className={styles.cryptoSymbol}>
                        {crypto.symbol.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  ${crypto.current_price.toLocaleString()}
                </td>
                <td className={styles.td}>
                  <span
                    className={`${styles.changeCell} ${
                      crypto.price_change_percentage_24h >= 0
                        ? styles.success
                        : styles.warning
                    }`}
                  >
                    {crypto.price_change_percentage_24h >= 0 ? (
                      <ArrowUp className={styles.arrow} />
                    ) : (
                      <ArrowDown className={styles.arrow} />
                    )}
                    {Math.abs(
                      crypto.price_change_percentage_24h
                    ).toFixed(2)}
                    %
                  </span>
                </td>
                <td className={styles.td}>
                  ${(crypto.total_volume / 1e6).toFixed(2)}M
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
