"use client";
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, TrendingUp } from 'lucide-react';
import styles from './CapitalMovementForm.module.css';

interface CapitalMovementFormData {
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  description: string;
}

interface CapitalMovementFormProps {
  onFormSubmit?: () => void;
}

const CapitalMovementForm: React.FC<CapitalMovementFormProps> = ({ onFormSubmit }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    valor: '',
    tipo: '' as 'DEPOSIT' | 'WITHDRAWAL' | '',
    descricao: ''
  });

  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (newMovement: CapitalMovementFormData) => {
      const response = await fetch('/api/capital-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMovement),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'Falha ao registrar movimento' };
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        // Trata como erro de regra de negócio (saldo insuficiente, etc.)
        setError(data.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ['capitalMovements'] });
        queryClient.invalidateQueries({ queryKey: ['trades'] });
        setFormData({
          valor: '',
          tipo: '',
          descricao: ''
        });
        setError(null);
        onFormSubmit?.();
      }
    },
    onError: (error) => {
      // Aqui sim é um erro real de rede/servidor
      setError(error.message);
      console.error("Erro inesperado ao registrar movimento:", error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.valor || !formData.tipo || !formData.descricao) {
      return;
    }

    const amount = parseFloat(formData.valor.replace(',', '.'));

    mutation.mutate({
      amount,
      type: formData.tipo as 'DEPOSIT' | 'WITHDRAWAL',
      description: formData.descricao
    });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, valor: e.target.value }));
    setError(null);
  };

  const handleTipoChange = (value: 'DEPOSIT' | 'WITHDRAWAL' | '') => {
    setFormData(prev => ({ ...prev, tipo: value }));
    setError(null);
  };

  const handleDescricaoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, descricao: e.target.value }));
    setError(null);
  };

  const isFormValid = formData.valor && formData.tipo && formData.descricao;

  return (
    <Card className={styles.card}>
      <CardHeader className={styles.cardHeader}>
        <CardTitle className={styles.cardTitle}>
          <div className={styles.gradientPrimary}>
            <TrendingUp className={styles.primaryForeground} />
          </div>
          Registrar Movimento de Capital
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.formSpaceY}>
          {error && <div key={error}><p className="text-red-500">{error}</p></div>}
          <div className={styles.gridCols1MdCols2}>
            <div className={styles.spaceY2}>
              <Label 
                htmlFor="valor" 
                className={`${styles.textSm} ${styles.fontMedium} ${styles.textCardForeground}`}
              >
                Valor (R$)
              </Label>
              <Input
                id="valor"
                type="text"
                placeholder="100,00"
                value={formData.valor}
                onChange={handleValorChange}
                className={styles.input}
                aria-describedby="valor-help"
                required
              />
              <p id="valor-help" className={`${styles.textXs} ${styles.textMutedForeground}`}>
                Digite o valor em reais
              </p>
            </div>

            <div className={styles.spaceY2}>
              <Label className={`${styles.textSm} ${styles.fontMedium} ${styles.textCardForeground}`}>
                Tipo
              </Label>
              <div role="radiogroup" className={styles.radioGroup} aria-labelledby="tipo-label">
                <div className={styles.radioItem}>
                  <input
                    type="radio"
                    id="deposit"
                    name="tipo"
                    value="DEPOSIT"
                    checked={formData.tipo === 'DEPOSIT'}
                    onChange={() => handleTipoChange('DEPOSIT')}
                    className={styles.radioInput}
                    required
                  />
                  <Label htmlFor="deposit" className={styles.radioLabel}>Aporte</Label>
                </div>
                <div className={styles.radioItem}>
                  <input
                    type="radio"
                    id="withdrawal"
                    name="tipo"
                    value="WITHDRAWAL"
                    checked={formData.tipo === 'WITHDRAWAL'}
                    onChange={() => handleTipoChange('WITHDRAWAL')}
                    className={styles.radioInput}
                    required
                  />
                  <Label htmlFor="withdrawal" className={styles.radioLabel}>Retirada</Label>
                </div>
              </div>
              <p id="tipo-help" className={`${styles.textXs} ${styles.textMutedForeground}`}>
                Escolha entre aporte ou retirada
              </p>
            </div>
          </div>

          <div className={styles.spaceY2}>
            <Label 
              htmlFor="descricao" 
              className={`${styles.textSm} ${styles.fontMedium} ${styles.textCardForeground}`}
            >
              Descrição
            </Label>
            <Textarea
              id="descricao"
              placeholder="Aporte inicial"
              value={formData.descricao}
              onChange={handleDescricaoChange}
              className={styles.textarea}
              aria-describedby="descricao-help"
              required
            />
            <p id="descricao-help" className={`${styles.textXs} ${styles.textMutedForeground}`}>
              Descreva o motivo ou detalhes do movimento
            </p>
          </div>

          <div className={styles.pt4}>
            <Button
              type="submit"
              disabled={!isFormValid || mutation.isPending}
              className={styles.button}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className={styles.loaderIcon} />
                  Registrando...
                </>
              ) : (
                'Registrar'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CapitalMovementForm;