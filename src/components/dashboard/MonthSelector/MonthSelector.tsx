'use client';

import { useState } from "react";
import styles from './MonthSelector.module.css';

interface MonthSelectorProps {
  initialDate: Date;
  onChange: (newDate: Date) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ initialDate, onChange }) => {
  const [currentDate, setCurrentDate] = useState(initialDate);

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    onChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    onChange(newDate);
  };

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const year = currentDate.getFullYear();

  return (
    <div className={styles.selectorContainer}>
      <button onClick={handlePreviousMonth} className={styles.arrowButton}>
        &lt;
      </button>
      <span className={styles.dateDisplay}>
        {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}
      </span>
      <button onClick={handleNextMonth} className={styles.arrowButton}>
        &gt;
      </button>
    </div>
  );
};

export default MonthSelector;
