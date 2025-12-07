'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import styles from './AccountCardForm.module.css';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { BankAccount, CreditCard } from '@prisma/client';

// Schemas e Tipos
const accountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  bankName: z.string().min(1, 'Nome do banco é obrigatório'),
  balance: z.number({
    error: (issue) => issue.code === 'invalid_type' ? 'Saldo deve ser um número' : undefined,
  }).refine((val) => !Number.isNaN(val), { message: 'Saldo deve ser um número válido' }),
  type: z.enum(['CHECKING', 'SAVINGS']),
});

const cardSchema = z.object({
  name: z.string().min(1, 'Apelido do cartão é obrigatório'),
  issuer: z.string().min(1, 'Emissor é obrigatório'),
  creditLimit: z.number({
    error: (issue) => issue.code === 'invalid_type' ? 'Limite deve ser um número' : undefined,
  }).refine((val) => !Number.isNaN(val), { message: 'Limite deve ser um número válido' }),
  closingDay: z.number({
    error: (issue) => issue.code === 'invalid_type' ? 'Dia de fechamento deve ser um número' : undefined,
  }).refine((val) => !Number.isNaN(val), { message: 'Dia de fechamento deve ser um número válido' })
    .int().min(1).max(31),
  dueDay: z.number({
    error: (issue) => issue.code === 'invalid_type' ? 'Dia de vencimento deve ser um número' : undefined,
  }).refine((val) => !Number.isNaN(val), { message: 'Dia de vencimento deve ser um número válido' })
    .int().min(1).max(31),
  flag: z.enum(['VISA', 'MASTERCARD', 'AMEX', 'ELO', 'HIPERCARD', 'OTHER']),
});

type AccountFormInput = z.input<typeof accountSchema>;
type AccountFormData = z.infer<typeof accountSchema>;
type CardFormInput = z.input<typeof cardSchema>;
type CardFormData = z.infer<typeof cardSchema>;

// Props para os formulários internos
interface FormProps<TData, TFormData> {
  initialData?: TData | null;
  onSave: (data: TFormData) => void;
  onClose: () => void;
  isLoading: boolean;
}

// --- Formulário de Conta Bancária ---
const AccountForm: React.FC<FormProps<BankAccount, AccountFormData>> = ({ initialData, onSave, onClose, isLoading }) => {
  const formDefaultValues = useMemo(() => {
    if (!initialData) return undefined;
    return {
      ...initialData,
      balance: Number(initialData.balance),
    };
  }, [initialData]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AccountFormInput, any, AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    reset(formDefaultValues);
  }, [formDefaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSave)} className={styles.form}>
      <div className={styles.formGroup}>
        <Label>Nome da Conta</Label>
        <Input {...register('name')} />
        {errors.name && <p className={styles.error}>{errors.name.message}</p>}
      </div>
      <div className={styles.formGroup}>
        <Label>Nome do Banco</Label>
        <Input {...register('bankName')} />
        {errors.bankName && <p className={styles.error}>{errors.bankName.message}</p>}
      </div>
      <div className={styles.formGroup}>
        <Label>Saldo</Label>
        <Input type="number" step="0.01" {...register('balance', { valueAsNumber: true })} />
        {errors.balance && <p className={styles.error}>{errors.balance.message}</p>}
      </div>
      <div className={styles.formGroup}>
        <Label>Tipo</Label>
        <select {...register('type')} className={styles.select}>
          <option value="CHECKING">Conta Corrente</option>
          <option value="SAVINGS">Poupança</option>
        </select>
      </div>
      <div className={styles.formActions}>
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

// --- Formulário de Cartão de Crédito ---
const CardForm: React.FC<FormProps<CreditCard, CardFormData>> = ({ initialData, onSave, onClose, isLoading }) => {
  const formDefaultValues = useMemo(() => {
    if (!initialData) return undefined;
    return {
      ...initialData,
      creditLimit: Number(initialData.creditLimit),
    };
  }, [initialData]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CardFormInput, any, CardFormData>({
    resolver: zodResolver(cardSchema),
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    reset(formDefaultValues);
  }, [formDefaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSave)} className={styles.form}>
      <div className={styles.formGroup}>
        <Label>Apelido</Label>
        <Input {...register('name')} />
        {errors.name && <p className={styles.error}>{errors.name.message}</p>}
      </div>
      <div className={styles.formGroup}>
        <Label>Emissor</Label>
        <Input {...register('issuer')} />
        {errors.issuer && <p className={styles.error}>{errors.issuer.message}</p>}
      </div>
      <div className={styles.formGroup}>
        <Label>Limite</Label>
        <Input type="number" step="0.01" {...register('creditLimit', { valueAsNumber: true })} />
        {errors.creditLimit && <p className={styles.error}>{errors.creditLimit.message}</p>}
      </div>
      <div className={styles.grid2Col}>
        <div className={styles.formGroup}>
          <Label>Fechamento</Label>
          <Input type="number" {...register('closingDay', { valueAsNumber: true })} />
          {errors.closingDay && <p className={styles.error}>{errors.closingDay.message}</p>}
        </div>
        <div className={styles.formGroup}>
          <Label>Vencimento</Label>
          <Input type="number" {...register('dueDay', { valueAsNumber: true })} />
          {errors.dueDay && <p className={styles.error}>{errors.dueDay.message}</p>}
        </div>
      </div>
      <div className={styles.formGroup}>
        <Label>Bandeira</Label>
        <select {...register('flag')} className={styles.select}>
          <option value="MASTERCARD">Mastercard</option>
          <option value="VISA">Visa</option>
          <option value="ELO">Elo</option>
          <option value="AMEX">American Express</option>
          <option value="HIPERCARD">Hipercard</option>
          <option value="OTHER">Outra</option>
        </select>
      </div>
      <div className={styles.formActions}>
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

// --- Componente Wrapper Principal ---
interface WrapperProps {
  type: 'account' | 'card';
  initialData?: BankAccount | CreditCard | null;
  onSave: (data: AccountFormData | CardFormData) => void;
  onClose: () => void;
  isLoading: boolean;
}

export function AccountCardForm({ type, initialData, onSave, onClose, isLoading }: WrapperProps) {
  if (type === 'account') {
    return (
      <AccountForm
        initialData={initialData as BankAccount | null}
        onSave={onSave as (data: AccountFormData) => void}
        onClose={onClose}
        isLoading={isLoading}
      />
    );
  }

  return (
    <CardForm
      initialData={initialData as CreditCard | null}
      onSave={onSave as (data: CardFormData) => void}
      onClose={onClose}
      isLoading={isLoading}
    />
  );
}