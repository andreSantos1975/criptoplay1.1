"use client";

import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download } from 'lucide-react';
import { CategoryAllocation, Category } from '../CategoryAllocation/CategoryAllocation';
import { BudgetSummary } from '../BudgetSummary/BudgetSummary';
import styles from './OrcamentoPage.module.css';

const financeHeroUrl = '/assets/hero-crypto.jpg';

interface OrcamentoPageProps {
  income: number;
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
  categories,
  onCategoryChange,
  onAddCategory,
  onRemoveCategory,
  onSaveBudget,
  onRestore,
  isLoading,
  totalPercentage,
}) => {

  const handleExportPDF = () => {
    const input = document.getElementById('budget-export-content');
    if (input) {
      html2canvas(input, {
        useCORS: true,
        scale: 2,
        backgroundColor: null, // Permite que a biblioteca detecte o fundo
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`orcamento-${new Date().toLocaleDateString('pt-BR')}.pdf`);
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

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

      <div id="budget-export-content" className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <div className={styles.incomeDisplayCard}>
            <div className={styles.incomeDisplayLabel}>Renda Mensal Bruta</div>
            <div className={styles.incomeDisplayValue}>{formatCurrency(income)}</div>
            <p className={styles.incomeDisplaySublabel}>
              Este valor é a soma das suas rendas cadastradas e é usado para o cálculo do orçamento.
            </p>
          </div>

          <div className={styles.budgetLayout}>
            <div className={styles.categoryAllocation}>
              <CategoryAllocation
                categories={categories}
                income={income}
                totalPercentage={totalPercentage}
                onCategoryChange={onCategoryChange}
                onAddCategory={onAddCategory}
                onRemoveCategory={onRemoveCategory}
              />
            </div>

            <div className={styles.budgetSummary}>
              <BudgetSummary
                categories={categories}
                totalIncome={income}
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
            <button onClick={handleExportPDF} disabled={isLoading} className={styles.exportButton} title="Exportar para PDF">
              <Download size={20} />
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
                <p>Reserva:</p>
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

