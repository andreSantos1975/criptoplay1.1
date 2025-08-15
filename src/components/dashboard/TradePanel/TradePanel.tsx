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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Remove o separador de milhares (ponto) e substitui a vírgula decimal por ponto
    const cleanedValue = value.replace(/\./g, '').replace(/,/g, '.');
    const parsedValue = parseFloat(cleanedValue);
    onLevelsChange({
      ...tradeLevels,
      [name]: isNaN(parsedValue) ? 0 : parsedValue,
    });
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
