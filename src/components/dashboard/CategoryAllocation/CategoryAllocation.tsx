import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import styles from './CategoryAllocation.module.css';

export interface Category {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  actualSpending?: number;
}

interface CategoryAllocationProps {
  categories: Category[];
  income: number;
  totalPercentage: number;
  onCategoryChange: (id: string, field: 'name' | 'percentage', value: string | number) => void;
  onAddCategory: () => void;
  onRemoveCategory: (id: string) => void;
}

export const CategoryAllocation: React.FC<CategoryAllocationProps> = ({ 
  categories,
  totalPercentage,
  onCategoryChange,
  onAddCategory,
  onRemoveCategory,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getProgressStatus = () => {
    if (totalPercentage === 100) return { color: styles.success, text: 'Perfeito! Total de 100%' };
    if (totalPercentage > 100) return { color: styles.destructive, text: `Excesso de ${totalPercentage - 100}%` };
    return { color: styles.warning, text: `Faltam ${100 - totalPercentage}%` };
  };

  const status = getProgressStatus();

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Alocação por Categoria</h3>
        <p className={styles.subtitle}>Distribua sua renda entre as categorias</p>
      </div>
      
      <div className={styles.content}>
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <label className={styles.progressLabel}>Total Alocado</label>
            <span className={`${styles.progressPercentage} ${status.color}`}>
              {totalPercentage}%
            </span>
          </div>
          <div className={styles.progressBar}>
             <div style={{ width: `${Math.min(totalPercentage, 100)}%` }} className={status.color.replace('text-', 'bg-')} />
          </div>
          <p className={`${styles.progressStatus} ${status.color}`}>
            {status.text}
          </p>
        </div>

        <div className={styles.categoriesList}>
          {categories.map((category) => (
            <div key={category.id} className={styles.categoryItem}>
              <div className={styles.categoryGrid}>
                <div className={styles.formField}>
                  <label htmlFor={`category-${category.id}`} className={styles.label}>
                    Nome da Categoria
                  </label>
                  <input
                    id={`category-${category.id}`}
                    value={category.name}
                    onChange={(e) => onCategoryChange(category.id, 'name', e.target.value)}
                    placeholder="Ex: Investimentos"
                    className={styles.input}
                  />
                </div>
                
                <div className={styles.formField}>
                  <label htmlFor={`percentage-${category.id}`} className={styles.label}>
                    Porcentagem (%)
                  </label>
                  <input
                    id={`percentage-${category.id}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={category.percentage}
                    onChange={(e) => onCategoryChange(category.id, 'percentage', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className={styles.input}
                  />
                </div>
                
                <div className={styles.amountWrapper}>
                  <div className={styles.amountHeader}>
                    <label className={styles.label}>Valor (R$)</label>
                    {categories.length > 1 && (
                      <button
                        onClick={() => onRemoveCategory(category.id)}
                        className={styles.removeButton}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className={styles.amountDisplay}>
                    <span>{formatCurrency(category.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button onClick={onAddCategory} className={styles.addButton}>
          <Plus size={16} />
          Adicionar Categoria
        </button>
      </div>
    </div>
  );
};