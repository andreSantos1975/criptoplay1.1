import React from 'react';
import styles from './IncomeInput.module.css';

interface IncomeInputProps {
  income: string;
  onIncomeChange: (value: string) => void;
}

export const IncomeInput: React.FC<IncomeInputProps> = ({ income, onIncomeChange }) => {

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (numericValue) {
      const number = parseInt(numericValue) / 100;
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(number);
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onIncomeChange(inputValue);
  };

  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <div className={styles.labelWrapper}>
          <label htmlFor="income" className={styles.label}>
            Renda Mensal Bruta
          </label>
          <p className={styles.sublabel}>
            Digite sua renda total recebida no mês
          </p>
        </div>
        
        <div className={styles.inputWrapper}>
          <input
            id="income"
            type="text"
            placeholder="R$ 0,00"
            value={income}
            onChange={handleInputChange}
            className={styles.input}
          />
        </div>
        
        {income && (
          <div className={styles.formattedValue}>
            <p>
              Valor formatado: <span>{formatCurrency(income)}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};