"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown, XCircle } from "lucide-react";
import CryptoIcon from "../../ui/CryptoIcon/CryptoIcon";
import styles from "./CryptoList.module.css";
import { Button } from "@/components/ui/button";


interface CryptoData {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  quote_volume: number;
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
      // Adjusted to handle BRL pairs
      const baseAsset = crypto.symbol.replace("BRL", "").replace("USDT", "");
      const name = coinNameMap[baseAsset] || baseAsset;

      return {
        id: crypto.symbol, // Use the full symbol as ID
        name,
        symbol: crypto.symbol, // Use the full symbol
        current_price: parseFloat(crypto.lastPrice),
        price_change_percentage_24h: parseFloat(crypto.priceChangePercent),
        quote_volume: parseFloat(crypto.quoteVolume),
      };
    });
};

const formatCurrency = (value: number, symbol: string, exchangeRate?: number): string => {
  let finalValue = value;
  let currency = symbol.endsWith('USDT') ? 'USD' : 'BRL';
  let locale = symbol.endsWith('USDT') ? 'en-US' : 'pt-BR';

  if (exchangeRate && symbol.endsWith('USDT')) {
      finalValue = value * exchangeRate;
      currency = 'BRL';
      locale = 'pt-BR';
  }

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  };

  if (finalValue < 1) {
    options.maximumFractionDigits = 8; // For very small prices like SHIB
  } else {
    options.maximumFractionDigits = 2; // For standard prices
  }

  return finalValue.toLocaleString(locale, options);
};

interface CryptoListProps {
  watchedSymbols: string[];
  onCryptoSelect: (symbol: string) => void;
  onDeleteSymbol: (symbol: string) => void; // New prop for deleting a symbol
  theme?: 'light' | 'dark';
  exchangeRate?: number;
}

export const CryptoList = ({ watchedSymbols, onCryptoSelect, onDeleteSymbol, theme = 'dark', exchangeRate }: CryptoListProps) => {
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
              <th className={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {cryptos?.map((crypto) => (
              <tr key={crypto.id} className={styles.tableRow} onClick={() => onCryptoSelect(crypto.symbol)}>
                <td className={styles.td}>
                  <div className={styles.nameCell}>
                    <CryptoIcon
                      symbol={crypto.symbol.replace("BRL", "").replace("USDT", "")}
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
                  {formatCurrency(crypto.current_price, crypto.symbol, exchangeRate)}
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
                  {formatCurrency(crypto.quote_volume, crypto.symbol, exchangeRate)}
                </td>
                <td className={styles.td}>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            onDeleteSymbol(crypto.symbol);
                        }}
                        className={`${styles.deleteButton} ${theme === 'light' ? styles.deleteButtonLight : styles.deleteButtonDark}`}
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
