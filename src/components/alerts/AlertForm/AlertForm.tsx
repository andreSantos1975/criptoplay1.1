'use client';

import { useState, useEffect } from 'react';
import styles from './AlertForm.module.css';
import { Alert, AlertType } from '@prisma/client';
import { useCreateAlert, useUpdateAlert } from '@/hooks/useAlerts';
import { useBudgetCategories } from '@/hooks/useBudget';

interface AlertFormProps {
  onClose: () => void;
  alertToEdit?: Alert | null;
}

const AlertForm = ({ onClose, alertToEdit }: AlertFormProps) => {
  const isEditMode = !!alertToEdit;

  // Form state
  const [alertType, setAlertType] = useState<AlertType>(AlertType.PRICE);
  // Price state
  const [symbol, setSymbol] = useState('');
  const [operator, setOperator] = useState('gt');
  const [targetPrice, setTargetPrice] = useState('');
  // Budget state
  const [budgetCategoryId, setBudgetCategoryId] = useState('');
  const [budgetPercentage, setBudgetPercentage] = useState('');


  const createAlertMutation = useCreateAlert();
  const updateAlertMutation = useUpdateAlert();
  const { data: budgetCategories, isLoading: isLoadingCategories } = useBudgetCategories();

  const resetFormFields = () => {
    setSymbol('');
    setOperator('gt');
    setTargetPrice('');
    setBudgetCategoryId('');
    setBudgetPercentage('');
  }

  useEffect(() => {
    if (isEditMode && alertToEdit) {
      resetFormFields();
      const config = alertToEdit.config as any;
      setAlertType(alertToEdit.type);
      if (alertToEdit.type === AlertType.PRICE) {
        setSymbol(config.symbol || '');
        setOperator(config.operator || 'gt');
        setTargetPrice(config.targetPrice || '');
      } else if (alertToEdit.type === AlertType.BUDGET) {
        setBudgetCategoryId(config.categoryId || '');
        setBudgetPercentage(config.percentage || '');
      }
    } else {
        resetFormFields();
    }
  }, [isEditMode, alertToEdit]);


  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    let config = {};
    if (alertType === AlertType.PRICE) {
      config = { symbol, operator, targetPrice: parseFloat(targetPrice) };
    } else if (alertType === AlertType.BUDGET) {
      config = { categoryId: budgetCategoryId, percentage: parseInt(budgetPercentage, 10) };
    }
    // TODO: Add logic for BILL alert type

    if (isEditMode) {
        updateAlertMutation.mutate({ id: alertToEdit.id, config, type: alertType } as any, {
            onSuccess: () => onClose(),
        });
    } else {
        createAlertMutation.mutate({ type: alertType, config, status: 'ACTIVE' } as any, {
            onSuccess: () => onClose(),
        });
    }
  };

  const renderPriceFields = () => (
    <>
      <div className={styles.formGroup}>
        <label htmlFor="symbol">Símbolo (ex: BTCUSDT)</label>
        <input type="text" id="symbol" name="symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} required />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="operator">Condição</label>
        <select id="operator" name="operator" value={operator} onChange={(e) => setOperator(e.target.value)} required>
          <option value="gt">Maior que (&gt;)</option>
          <option value="lt">Menor que (&lt;)</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="targetPrice">Preço Alvo</label>
        <input type="number" id="targetPrice" name="targetPrice" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} step="any" required />
      </div>
    </>
  );

  const renderBudgetFields = () => {
    if (isLoadingCategories) return <p>Carregando categorias...</p>
    if (!budgetCategories) return <p>Não foi possível carregar as categorias.</p>

    return (
        <>
            <div className={styles.formGroup}>
                <label htmlFor="budgetCategoryId">Categoria</label>
                <select id="budgetCategoryId" name="budgetCategoryId" value={budgetCategoryId} onChange={(e) => setBudgetCategoryId(e.target.value)} required>
                    <option value="" disabled>Selecione uma categoria</option>
                    {budgetCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="budgetPercentage">Disparar em (%)</label>
                <input type="number" id="budgetPercentage" name="budgetPercentage" value={budgetPercentage} onChange={(e) => setBudgetPercentage(e.target.value)} min="1" max="100" required />
            </div>
        </>
    )
  };

  const renderBillFields = () => (
    <div className={styles.placeholder}>
      <p>Campos para alertas de contas a pagar serão implementados aqui.</p>
    </div>
  );
  
  const isSubmitting = createAlertMutation.isPending || updateAlertMutation.isPending;

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <h2>{isEditMode ? 'Editar Alerta' : 'Novo Alerta'}</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="alertType">Tipo de Alerta</label>
            <select
              id="alertType"
              name="alertType"
              value={alertType}
              onChange={(e) => {
                setAlertType(e.target.value as AlertType);
                resetFormFields();
              }}
              disabled={isEditMode}
            >
              <option value={AlertType.PRICE}>Preço de Cripto</option>
              <option value={AlertType.BUDGET}>Orçamento</option>
              <option value={AlertType.BILL}>Contas a Pagar</option>
            </select>
          </div>

          {alertType === AlertType.PRICE && renderPriceFields()}
          {alertType === AlertType.BUDGET && renderBudgetFields()}
          {alertType === AlertType.BILL && renderBillFields()}

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveButton} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AlertForm;
