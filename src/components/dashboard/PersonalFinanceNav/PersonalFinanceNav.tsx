import React from 'react';
import Link from 'next/link';
import styles from './PersonalFinanceNav.module.css';

interface PersonalFinanceNavProps {
  activeTab: string;
}

export const PersonalFinanceNav: React.FC<PersonalFinanceNavProps> = ({ activeTab }) => {
  return (
    <nav className={styles.nav}>
      <Link 
        href="/dashboard?tab=pessoal&subtab=movimentacoes"
        className={`${styles.button} ${activeTab === 'movimentacoes' ? styles.active : ''}`}
      >
        Movimentações
      </Link>
      <Link 
        href="/dashboard?tab=pessoal&subtab=orcamento"
        className={`${styles.button} ${activeTab === 'orcamento' ? styles.active : ''}`}
      >
        Orçamento
      </Link>
    </nav>
  );
};
