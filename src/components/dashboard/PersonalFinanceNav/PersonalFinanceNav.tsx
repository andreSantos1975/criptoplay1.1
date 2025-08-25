import React from 'react';
import styles from './PersonalFinanceNav.module.css';

interface PersonalFinanceNavProps {
  activeTab: string;
  onTabChange: (tab: 'movimentacoes' | 'orcamento') => void;
}

export const PersonalFinanceNav: React.FC<PersonalFinanceNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className={styles.nav}>
      <button 
        className={`${styles.button} ${activeTab === 'movimentacoes' ? styles.active : ''}`}
        onClick={() => onTabChange('movimentacoes')}
      >
        Movimentações
      </button>
      <button 
        className={`${styles.button} ${activeTab === 'orcamento' ? styles.active : ''}`}
        onClick={() => onTabChange('orcamento')}
      >
        Orçamento
      </button>
    </nav>
  );
};
