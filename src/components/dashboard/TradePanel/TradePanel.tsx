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
  marketType: 'spot' | 'futures'; // Add marketType prop
}

export const TradePanel = ({ tradeLevels, onLevelsChange, marketType }: TradePanelProps) => {
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
          <input type="text" id="amount" name="amount" />
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
          type="text"
          id="entry"
          name="entry"
          value={tradeLevels.entry !== undefined ? formatNumber(tradeLevels.entry) : ''}
          onChange={handleChange}
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="takeProfit">Take Profit</label>
        <input
          type="text"
          id="takeProfit"
          name="takeProfit"
          value={tradeLevels.takeProfit !== undefined ? formatNumber(tradeLevels.takeProfit) : ''}
          onChange={handleChange}
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="stopLoss">Stop Loss</label>
        <input
          type="text"
          id="stopLoss"
          name="stopLoss"
          value={tradeLevels.stopLoss !== undefined ? formatNumber(tradeLevels.stopLoss) : ''}
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
