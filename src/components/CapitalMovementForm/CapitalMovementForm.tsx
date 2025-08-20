import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import styles from './CapitalMovementForm.module.css';

interface CapitalMovementFormData {
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  description: string;
}

const CapitalMovementForm: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    valor: '',
    tipo: '' as 'DEPOSIT' | 'WITHDRAWAL' | '',
    descricao: ''
  });

  const mutation = useMutation({
    mutationFn: (newMovement: CapitalMovementFormData) => {
      return fetch('/api/capital-movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMovement),
      }).then(res => {
        if (!res.ok) {
          throw new Error('Falha ao registrar movimento');
        }
        return res.json();
      });
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['capitalMovements'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      setFormData({
        valor: '',
        tipo: '',
        descricao: ''
      });
    },
    onError: (error) => {
      console.error("Erro ao registrar movimento:", error);
      // Here you could add a toast notification to inform the user
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.valor || !formData.tipo || !formData.descricao) {
      return;
    }

    const amount = parseFloat(formData.valor.replace('.', '').replace(',', '.'));

    mutation.mutate({
      amount,
      type: formData.tipo as 'DEPOSIT' | 'WITHDRAWAL',
      description: formData.descricao
    });
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
          {/* Grid layout for form fields */}
          <div className={styles.gridCols1MdCols2}>
            {/* Valor Field */}
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
                onChange={(e) => handleInputChange('valor', e.target.value)}
                className={styles.input}
                aria-describedby="valor-help"
                required
              />
              <p id="valor-help" className={`${styles.textXs} ${styles.textMutedForeground}`}>
                Digite o valor em reais
              </p>
            </div>

            {/* Tipo Field */}
            <div className={styles.spaceY2}>
              <Label 
                htmlFor="tipo" 
                className={`${styles.textSm} ${styles.fontMedium} ${styles.textCardForeground}`}
              >
                Tipo
              </Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(value: 'DEPOSIT' | 'WITHDRAWAL') => handleInputChange('tipo', value)}
                required
              >
                <SelectTrigger 
                  id="tipo"
                  className={styles.selectTrigger}
                  aria-describedby="tipo-help"
                >
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className={styles.selectContent}>
                  <SelectItem value="DEPOSIT" className={styles.selectItem}>
                    <div className={styles.flexItemsCenterGap2}>
                      <TrendingUp className={`h-4 w-4 ${styles.textSuccess}`} />
                      Aporte
                    </div>
                  </SelectItem>
                  <SelectItem value="WITHDRAWAL" className={styles.selectItem}>
                    <div className={styles.flexItemsCenterGap2}>
                      <TrendingDown className={`h-4 w-4 ${styles.textDestructive}`} />
                      Retirada
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p id="tipo-help" className={`${styles.textXs} ${styles.textMutedForeground}`}>
                Escolha entre aporte ou retirada
              </p>
            </div>
          </div>

          {/* Descrição Field - Full width */}
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
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              className={styles.textarea}
              aria-describedby="descricao-help"
              required
            />
            <p id="descricao-help" className={`${styles.textXs} ${styles.textMutedForeground}`}>
              Descreva o motivo ou detalhes do movimento
            </p>
          </div>

          {/* Submit Button */}
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
