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
  quote_volume: number; // Changed from total_volume to quote_volume for currency value
}

interface BinanceTicker24hr {
  symbol: string;
  quoteVolume: string;
  lastPrice: string;
  priceChangePercent: string;
}

const fetchCryptoData = async (symbols: string[]): Promise<CryptoData[]> => {
  const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  if (!response.ok) {
    throw new Error("Erro ao buscar dados da Binance API");
  }
  const data: BinanceTicker24hr[] = await response.json();

  const coinNameMap: Record<string, string> = {
    BTC: "Bitcoin",
    ETH: "Ethereum",
    SOL: "Solana",
    USDC: "USD Coin",
    FDUSD: "First Digital USD",
    XRP: "XRP",
    ADA: "Cardano",
    DOGE: "Dogecoin",
    SHIB: "Shiba Inu",
    BNB: "BNB",
  };

  return data
    .filter((crypto) => symbols.includes(crypto.symbol))
    .map((crypto) => {
      const baseAsset = crypto.symbol.replace("USDT", "");
      const name = coinNameMap[baseAsset] || baseAsset;

      return {
        id: baseAsset,
        name,
        symbol: baseAsset,
        current_price: parseFloat(crypto.lastPrice),
        price_change_percentage_24h: parseFloat(crypto.priceChangePercent),
        quote_volume: parseFloat(crypto.quoteVolume), // Use quoteVolume for currency value
      };
    });
};

// Helper function for formatting prices and volumes in BRL
const formatBRLCurrency = (value: number): string => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  };

  if (value < 1) {
    options.maximumFractionDigits = 8; // For very small prices like SHIB
  } else {
    options.maximumFractionDigits = 2; // For standard prices
  }

  return value.toLocaleString('pt-BR', options);
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
              <th className={styles.th}>Volume (24h)</th>
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
                  {formatBRLCurrency(crypto.current_price)}
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
                  {formatBRLCurrency(crypto.quote_volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};