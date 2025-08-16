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
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: 2, // Always show at least 2 decimal places
    };

    if (num >= 1000) {
      options.maximumFractionDigits = 2; // e.g., 1,234.56
    } else if (num >= 1) {
      options.maximumFractionDigits = 4; // e.g., 12.3456
    } else if (num >= 0.01) { // For numbers like 0.231, 0.919
      options.maximumFractionDigits = 6; // e.g., 0.123456
    } else { // For very small numbers like SHIB
      options.maximumFractionDigits = 8; // e.g., 0.00001234
    }

    return num.toLocaleString('pt-BR', options);
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
