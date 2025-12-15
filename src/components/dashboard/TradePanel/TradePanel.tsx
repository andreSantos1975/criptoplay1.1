import { useQuery } from "@tanstack/react-query";
import styles from './TradePanel.module.css';
import { useState } from "react";

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
  marketType: 'spot' | 'futures'; // Add marketType prop
}

export const TradePanel = ({ tradeLevels, onLevelsChange, marketType }: TradePanelProps) => {
  const [spotAmount, setSpotAmount] = useState('');

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

  const handleSpotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSpotAmount(e.target.value);
  };

  const formatNumber = (num: number) => {
    const numInBRL = num * brlRate;
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };

    return numInBRL.toLocaleString('pt-BR', options);
  };

  // Render different panels based on marketType
  if (marketType === 'spot') {
    return (
      <div className={styles.panel}>
        <h4>Operar Spot</h4>
        <div className={styles.inputGroup}>
          <label htmlFor="amount">Quantidade</label>
          <input
            type="text"
            id="amount"
            name="amount"
            value={spotAmount}
            onChange={handleSpotChange}
          />
        </div>
        <div className={styles.buttonGroup}>
          <button className={styles.buyButton}>Comprar</button>
          <button className={styles.sellButton}>Vender</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
       <h4>Operar Futuros</h4>
      <div className={styles.inputGroup}>
        <label htmlFor="entry">Entrada</label>
        <input
          type="number"
          id="entry"
          name="entry"
          step="0.01"
          value={tradeLevels.entry !== undefined ? tradeLevels.entry : ''}
          onChange={handleChange}
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="takeProfit">Take Profit</label>
        <input
          type="number"
          id="takeProfit"
          name="takeProfit"
          step="0.01"
          value={tradeLevels.takeProfit !== undefined ? tradeLevels.takeProfit : ''}
          onChange={handleChange}
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="stopLoss">Stop Loss</label>
        <input
          type="number"
          id="stopLoss"
          name="stopLoss"
          step="0.01"
          value={tradeLevels.stopLoss !== undefined ? tradeLevels.stopLoss : ''}
          onChange={handleChange}
        />
      </div>
       <div className={styles.buttonGroup}>
          <button className={styles.buyButton}>Comprar/Long</button>
          <button className={styles.sellButton}>Vender/Short</button>
        </div>
    </div>
  );
};