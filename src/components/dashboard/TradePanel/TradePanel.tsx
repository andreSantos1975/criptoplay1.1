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
    const parsedValue = parseFloat(value);
    onLevelsChange({
      ...tradeLevels,
      [name]: isNaN(parsedValue) ? 0 : parsedValue,
    });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.inputGroup}>
        <label htmlFor="entry">Entrada</label>
        <input
          type="number"
          id="entry"
          name="entry"
          value={tradeLevels.entry}
          onChange={handleChange}
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="takeProfit">Take Profit</label>
        <input
          type="number"
          id="takeProfit"
          name="takeProfit"
          value={tradeLevels.takeProfit}
          onChange={handleChange}
        />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="stopLoss">Stop Loss</label>
        <input
          type="number"
          id="stopLoss"
          name="stopLoss"
          value={tradeLevels.stopLoss}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};
