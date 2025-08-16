"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown } from "lucide-react";
import CryptoIcon from "../../ui/CryptoIcon/CryptoIcon";
import styles from "./CryptoList.module.css";

interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

interface BinanceTicker24hr {
  symbol: string;
  quoteVolume: string;
  lastPrice: string;
  priceChangePercent: string;
  volume: string;
}

const fetchCryptoData = async (symbols: string[]): Promise<CryptoData[]> => {
  const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  if (!response.ok) {
    throw new Error("Erro ao buscar dados");
  }
  const data: BinanceTicker24hr[] = await response.json();

  const coinNameMap: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    SOL: "Solana",
    USDC: "USD Coin",
    FDUSD: "First Digital USD",
    XRP: "XRP", // Add XRP to the map
  };

  return data
    .filter((crypto) => symbols.includes(crypto.symbol))
    .map((crypto) => {
      const baseAsset = crypto.symbol.replace("USDT", "");
      const name = coinNameMap[baseAsset] || baseAsset;
      // Add logging for SHIB
      if (baseAsset === 'SHIB') {
        console.log('SHIB raw lastPrice:', crypto.lastPrice);
        console.log('SHIB parsed current_price:', parseFloat(crypto.lastPrice));
      }

      return {
        id: baseAsset,
        name,
        symbol: baseAsset,
        current_price: parseFloat(crypto.lastPrice),
        price_change_percentage_24h: parseFloat(crypto.priceChangePercent),
        total_volume: parseFloat(crypto.volume),
      };
    });
};

// Helper function for formatting crypto prices
const formatCryptoPrice = (price: number): string => {
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2, // Always show at least 2 decimal places
  };

  if (price >= 1000) {
    options.maximumFractionDigits = 2; // e.g., 1,234.56
  } else if (price >= 1) {
    options.maximumFractionDigits = 4; // e.g., 12.3456
  } else if (price >= 0.01) { // For numbers like 0.231, 0.919
    options.maximumFractionDigits = 6; // e.g., 0.123456
  } else { // For very small numbers like SHIB
    options.maximumFractionDigits = 8; // e.g., 0.00001234
  }

  return price.toLocaleString('pt-BR', options);
};

interface CryptoListProps {
  watchedSymbols: string[];
  onCryptoSelect: (symbol: string) => void;
}

export const CryptoList = ({ watchedSymbols, onCryptoSelect }: CryptoListProps) => {
  const { data: cryptos, isLoading, error } = useQuery<CryptoData[]>({
    queryKey: ["cryptos", watchedSymbols],
    queryFn: () => fetchCryptoData(watchedSymbols),
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
              <tr key={crypto.id} className={styles.tableRow} onClick={() => onCryptoSelect(crypto.symbol + "USDT")}>
                <td className={styles.td}>
                  <div className={styles.nameCell}>
                    <CryptoIcon
                      symbol={crypto.symbol}
                      className={styles.cryptoImage}
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
                  ${formatCryptoPrice(crypto.current_price)}
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
