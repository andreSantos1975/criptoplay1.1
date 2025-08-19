import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import styles from './CapitalMovementForm.module.css';

interface CapitalMovementFormData {
  valor: string;
  tipo: 'DEPOSIT' | 'WITHDRAWAL' | '';
  descricao: string;
}

const CapitalMovementForm: React.FC = () => {
  const [formData, setFormData] = useState<CapitalMovementFormData>({
    valor: '',
    tipo: '',
    descricao: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.valor || !formData.tipo || !formData.descricao) {
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Movimento registrado:', formData);
      setIsLoading(false);
      // Reset form
      setFormData({
        valor: '',
        tipo: '',
        descricao: ''
      });
    }, 2000);
  };

  const handleInputChange = (field: keyof CapitalMovementFormData, value: string) => {
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
              disabled={!isFormValid || isLoading}
              className={styles.button}
            >
              {isLoading ? (
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
