
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from './AccountCardForm.module.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BankAccount, CreditCard } from '@prisma/client';

// Schemas for validation
const accountSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  bankName: z.string().min(1, 'O nome do banco é obrigatório'),
  balance: z.preprocess((val) => Number(String(val)), z.number().positive('O saldo deve ser positivo')),
  type: z.enum(['CHECKING', 'SAVINGS']),
});

const cardSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  issuer: z.string().min(1, 'O emissor é obrigatório'),
  creditLimit: z.preprocess((val) => Number(String(val)), z.number().positive('O limite deve ser positivo')),
  closingDay: z.preprocess((val) => Number(String(val)), z.number().int().min(1).max(31)),
  dueDay: z.preprocess((val) => Number(String(val)), z.number().int().min(1).max(31)),
  flag: z.enum(['VISA', 'MASTERCARD', 'AMEX', 'ELO', 'HIPERCARD', 'OTHER']),
});

const formSchema = z.union([accountSchema, cardSchema]);
type FormData = z.infer<typeof formSchema>;

interface AccountCardFormProps {
  type: 'account' | 'card';
  onClose: () => void;
  onSave: (data: FormData) => void;
  isLoading: boolean;
  initialData?: BankAccount | CreditCard | null;
}

export function AccountCardForm({ type, onClose, onSave, isLoading, initialData }: AccountCardFormProps) {
  const currentSchema = type === 'account' ? accountSchema : cardSchema;
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(currentSchema),
    defaultValues: initialData || {},
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const onSubmit = (data: FormData) => {
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      {type === 'account' && (
        <>
          <div className={styles.formGroup}>
            <Label htmlFor="name">Nome da Conta</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className={styles.error}>{errors.name.message}</p>}
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="bankName">Nome do Banco</Label>
            <Input id="bankName" {...register('bankName')} />
            {errors.bankName && <p className={styles.error}>{errors.bankName.message}</p>}
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="balance">Saldo Inicial (R$)</Label>
            <Input id="balance" type="number" step="0.01" {...register('balance')} />
            {errors.balance && <p className={styles.error}>{errors.balance.message}</p>}
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="type">Tipo de Conta</Label>
            <select id="type" {...register('type')} className={styles.select}>
              <option value="CHECKING">Conta Corrente</option>
              <option value="SAVINGS">Poupança</option>
            </select>
          </div>
        </>
      )}

      {type === 'card' && (
        <>
          <div className={styles.formGroup}>
            <Label htmlFor="name">Apelido do Cartão</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className={styles.error}>{errors.name.message}</p>}
          </div>
           <div className={styles.formGroup}>
            <Label htmlFor="issuer">Emissor (Ex: Nubank, Itaú)</Label>
            <Input id="issuer" {...register('issuer')} />
            {errors.issuer && <p className={styles.error}>{errors.issuer.message}</p>}
          </div>
          <div className={styles.formGroup}>
            <Label htmlFor="creditLimit">Limite de Crédito (R$)</Label>
            <Input id="creditLimit" type="number" step="0.01" {...register('creditLimit')} />
            {errors.creditLimit && <p className={styles.error}>{errors.creditLimit.message}</p>}
          </div>
          <div className={styles.grid2Col}>
            <div className={styles.formGroup}>
              <Label htmlFor="closingDay">Dia do Fechamento</Label>
              <Input id="closingDay" type="number" {...register('closingDay')} />
              {errors.closingDay && <p className={styles.error}>{errors.closingDay.message}</p>}
            </div>
            <div className={styles.formGroup}>
              <Label htmlFor="dueDay">Dia do Vencimento</Label>
              <Input id="dueDay" type="number" {...register('dueDay')} />
              {errors.dueDay && <p className={styles.error}>{errors.dueDay.message}</p>}
            </div>
          </div>
           <div className={styles.formGroup}>
            <Label htmlFor="flag">Bandeira</Label>
            <select id="flag" {...register('flag')} className={styles.select}>
              <option value="MASTERCARD">Mastercard</option>
              <option value="VISA">Visa</option>
              <option value="ELO">Elo</option>
              <option value="AMEX">American Express</option>
              <option value="HIPERCARD">Hipercard</option>
              <option value="OTHER">Outra</option>
            </select>
          </div>
        </>
      )}

      <div className={styles.formActions}>
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
