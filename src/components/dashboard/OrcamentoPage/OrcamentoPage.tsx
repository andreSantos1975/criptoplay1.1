"use client";

import React from 'react';
import { IncomeInput } from '../IncomeInput/IncomeInput';
import { CategoryAllocation, Category } from '../CategoryAllocation/CategoryAllocation';
import { BudgetSummary } from '../BudgetSummary/BudgetSummary';
import styles from './OrcamentoPage.module.css';

const financeHeroUrl = '/assets/hero-crypto.jpg';

interface OrcamentoPageProps {
  income: string;
  onIncomeChange: (value: string) => void;
  categories: Category[];
  onCategoryChange: (id: string, field: 'name' | 'percentage', value: string | number) => void;
  onAddCategory: () => void;
  onRemoveCategory: (id: string) => void;
  onSaveBudget: () => void;
  onRestore: () => void;
  isLoading: boolean;
  totalPercentage: number;
}

export const OrcamentoPage: React.FC<OrcamentoPageProps> = ({
  income,
  onIncomeChange,
  categories,
  onCategoryChange,
  onAddCategory,
  onRemoveCategory,
  onSaveBudget,
  onRestore,
  isLoading,
  totalPercentage,
}) => {
  const incomeValue = React.useMemo(() => {
    const sanitizedValue = income.replace(',', '.');
    const numericString = sanitizedValue.replace(/[^0-9.]/g, '');
    const value = parseFloat(numericString);
    return isNaN(value) ? 0 : value;
  }, [income]);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div 
          className={styles.heroOverlay}
          style={{
            backgroundImage: `url(${financeHeroUrl})`
          }}
        />
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              Planejamento & Orçamento
              <span>Inteligente</span>
            </h1>
            <p className={styles.subtitle}>
              Organize suas finanças de forma simples e eficiente. 
              Distribua sua renda e alcance seus objetivos financeiros.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <IncomeInput 
            income={income}
            onIncomeChange={onIncomeChange}
          />

          <div className={styles.budgetLayout}>
            <div className={styles.categoryAllocation}>
              <CategoryAllocation
                categories={categories}
                income={incomeValue}
                totalPercentage={totalPercentage}
                onCategoryChange={onCategoryChange}
                onAddCategory={onAddCategory}
                onRemoveCategory={onRemoveCategory}
              />
            </div>

            <div className={styles.budgetSummary}>
              <BudgetSummary
                categories={categories}
                totalIncome={incomeValue}
                totalPercentage={totalPercentage}
              />
            </div>
          </div>
          
          <div className={styles.saveButtonContainer}>
            <button onClick={onRestore} disabled={isLoading} className={styles.restoreButton}>
              Restaurar
            </button>
            <button onClick={onSaveBudget} disabled={isLoading} className={styles.saveButton}>
              {isLoading ? 'Salvando...' : 'Salvar Orçamento'}
            </button>
          </div>

          <div className={styles.tipsSection}>
            <h3 className={styles.tipsTitle}>
              Dicas para um Orçamento Eficiente
            </h3>
            <div className={styles.tipsGrid}>
              <div className={styles.tipItem}>
                <p>Regra 50-30-20:</p>
                <p>50% necessidades, 30% desejos, 20% poupança/investimentos</p>
              </div>
              <div className={styles.tipItem}>
                <p>Reserva de Emergência:</p>
                <p>Mantenha de 3 a 6 meses de gastos em uma reserva</p>
              </div>
              <div className={styles.tipItem}>
                <p>Invista Regularmente:</p>
                <p>Mesmo pequenos valores fazem diferença no longo prazo</p>
              </div>
              <div className={styles.tipItem}>
                <p>Revise Mensalmente:</p>
                <p>Ajuste seu orçamento conforme mudanças na vida</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

