import React, { useState, useEffect } from 'react';
import { IncomeInput } from '../IncomeInput/IncomeInput';
import { CategoryAllocation, Category } from '../CategoryAllocation/CategoryAllocation';
import { BudgetSummary } from '../BudgetSummary/BudgetSummary';
import styles from './OrcamentoPage.module.css';

// Assuming finance-hero.jpg is correctly placed in public/assets
const financeHeroUrl = '/assets/hero-crypto.jpg';

export const OrcamentoPage = () => {
  const [income, setIncome] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Investimentos', percentage: 20, amount: 0 },
    { id: '2', name: 'Reserva Financeira', percentage: 15, amount: 0 },
    { id: '3', name: 'Despesas Essenciais', percentage: 50, amount: 0 },
    { id: '4', name: 'Lazer', percentage: 10, amount: 0 },
    { id: '5', name: 'Outros', percentage: 5, amount: 0 },
  ]);

  const incomeValue = React.useMemo(() => {
    // Trata o valor de entrada como um número decimal, e não como centavos.
    // Substitui a vírgula por ponto para garantir a conversão correta.
    const sanitizedValue = income.replace(',', '.');
    // Remove todos os caracteres que não são dígitos ou o ponto decimal.
    const numericString = sanitizedValue.replace(/[^0-9.]/g, '');
    const value = parseFloat(numericString);
    return isNaN(value) ? 0 : value;
  }, [income]);

  const totalPercentage = React.useMemo(() => {
    return categories.reduce((sum, category) => sum + category.percentage, 0);
  }, [categories]);

  useEffect(() => {
    const updatedCategories = categories.map(category => ({
      ...category,
      amount: (incomeValue * category.percentage) / 100
    }));
    setCategories(updatedCategories);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomeValue]);

  const handleCategoryChange = (id: string, field: 'name' | 'percentage', value: string | number) => {
    setCategories(prevCategories => {
      const updatedCategories = prevCategories.map(category => {
        if (category.id === id) {
          const updatedCategory = { ...category, [field]: value };
          if (field === 'percentage') {
            updatedCategory.amount = (incomeValue * (value as number)) / 100;
          }
          return updatedCategory;
        }
        return category;
      });
      return updatedCategories;
    });
  };

  const handleAddCategory = () => {
    const newId = Date.now().toString();
    const newCategory: Category = {
      id: newId,
      name: 'Nova Categoria',
      percentage: 0,
      amount: 0
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const handleRemoveCategory = (id: string) => {
    setCategories(prev => prev.filter(category => category.id !== id));
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div 
          className={styles.heroOverlay}
          style={{
            backgroundImage: `url(${financeHeroUrl})`,
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
            onIncomeChange={setIncome}
          />

          <div className={styles.budgetLayout}>
            <div className={styles.categoryAllocation}>
              <CategoryAllocation
                categories={categories}
                income={incomeValue}
                totalPercentage={totalPercentage}
                onCategoryChange={handleCategoryChange}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
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
