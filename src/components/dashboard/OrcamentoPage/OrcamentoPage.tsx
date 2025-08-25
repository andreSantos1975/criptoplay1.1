"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { IncomeInput } from '../IncomeInput/IncomeInput';
import { CategoryAllocation, Category } from '../CategoryAllocation/CategoryAllocation';
import { BudgetSummary } from '../BudgetSummary/BudgetSummary';
import styles from './OrcamentoPage.module.css';

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
  const [isLoading, setIsLoading] = useState(false);

  // Fetch budget data from the API on component mount
  useEffect(() => {
    const fetchBudget = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/budget'); // Assumes current month/year
        if (response.ok) {
          const data = await response.json();
          if (data) {
            setIncome(data.income.toString());
            setCategories(data.categories.map((cat: { id?: string; name: string; percentage: number }, index: number) => ({
              ...cat,
              id: cat.id || index.toString(), // Ensure there is a unique id
              amount: (data.income * cat.percentage) / 100,
            })));
          }
        }
      } catch (error) {
        console.error("Failed to fetch budget:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBudget();
  }, []);

  const incomeValue = React.useMemo(() => {
    const sanitizedValue = income.replace(',', '.');
    const numericString = sanitizedValue.replace(/[^0-9.]/g, '');
    const value = parseFloat(numericString);
    return isNaN(value) ? 0 : value;
  }, [income]);

  const totalPercentage = React.useMemo(() => {
    return categories.reduce((sum, category) => sum + (Number(category.percentage) || 0), 0);
  }, [categories]);

  useEffect(() => {
    const updatedCategories = categories.map(category => ({
      ...category,
      amount: (incomeValue * (Number(category.percentage) || 0)) / 100
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
            updatedCategory.amount = (incomeValue * (Number(value) || 0)) / 100;
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

  const handleSaveBudget = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: incomeValue,
          categories: categories.map(({ name, percentage }) => ({ name, percentage })),
          month: new Date().getMonth() + 1, // Use current month/year
          year: new Date().getFullYear(),
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save budget');
      }
      // Optionally show a success message
      alert('Orçamento salvo com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar orçamento.');
    } finally {
      setIsLoading(false);
    }
  }, [incomeValue, categories]);

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
          
          <div className={styles.saveButtonContainer}>
            <button onClick={handleSaveBudget} disabled={isLoading} className={styles.saveButton}>
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

