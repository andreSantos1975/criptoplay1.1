import { useQuery } from "@tanstack/react-query";
import styles from './TradePanel.module.css';

interface TradePanelProps {
  tradeLevels: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
  };
  onLevelsChange: (newLevels: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
  }) => void;
}

export const TradePanel = ({ tradeLevels, onLevelsChange }: TradePanelProps) => {
  const { data: exchangeRateData } = useQuery({
    queryKey: ["exchangeRate"],
    queryFn: async () => {
      const response = await fetch("/api/exchange-rate");
      if (!response.ok) throw new Error("Failed to fetch exchange rate");
      return response.json();
    },
    refetchInterval: 60000,
  });

  const brlRate = exchangeRateData?.usdtToBrl || 1;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const cleanedValue = value.replace(/\./g, '').replace(/,/g, '.');
    const parsedValue = parseFloat(cleanedValue);
    const valueInUSD = parsedValue / brlRate;
    onLevelsChange({
      ...tradeLevels,
      [name]: isNaN(valueInUSD) ? 0 : valueInUSD,
    });
  };

  const formatNumber = (num: number) => {
    const numInBRL = num * brlRate;
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2,
    };

    if (numInBRL >= 1000) {
      options.maximumFractionDigits = 2;
    } else if (numInBRL >= 1) {
      options.maximumFractionDigits = 4;
    } else if (numInBRL >= 0.01) {
      options.maximumFractionDigits = 6;
    } else {
      options.maximumFractionDigits = 8;
    }

    return numInBRL.toLocaleString('pt-BR', options);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.inputGroup}>
        <label htmlFor="entry">Entrada</label>
        <input
          type="text"
          id="entry"
          name="entry"
          value={formatNumber(tradeLevels.entry)}
          onChange={handleChange}
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="takeProfit">Take Profit</label>
        <input
          type="text"
          id="takeProfit"
          name="takeProfit"
          value={formatNumber(tradeLevels.takeProfit)}
          onChange={handleChange}
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="stopLoss">Stop Loss</label>
        <input
          type="text"
          id="stopLoss"
          name="stopLoss"
          value={formatNumber(tradeLevels.stopLoss)}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
