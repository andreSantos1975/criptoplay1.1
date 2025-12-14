
'use client';

import React from 'react';
import styles from './AccountCardList.module.css';
import { BankAccount, CreditCard } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';

interface AccountCardListProps {
  title: string;
  items: (BankAccount | CreditCard)[];
  onAdd: () => void;
  onEdit: (item: BankAccount | CreditCard) => void;
  onDelete: (id: string) => void;
  type: 'account' | 'card';
}

const formatCurrency = (value: number | string) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
};

export function AccountCardList({ title, items, onAdd, onEdit, onDelete, type }: AccountCardListProps) {
  return (
    <div className={styles.listContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>
      <div className={styles.content}>
        {items.length === 0 ? (
          <p className={styles.emptyMessage}>Nenhum {type === 'account' ? 'conta' : 'cartão'} cadastrado.</p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id} className={styles.listItem}>
                <div className={styles.itemDetails}>
                  <span className={styles.itemName}>{item.name}</span>
                  <span className={styles.itemSub}>{ 'bankName' in item ? item.bankName : item.issuer}</span>
                </div>
                <div className={styles.itemValues}>
                  {type === 'account' && 'balance' in item && (
                    <span className={styles.balance}>{formatCurrency(item.balance)}</span>
                  )}
                   {type === 'card' && 'availableCredit' in item && (
                    <div>
                      <span className={styles.limit}>Limite: {formatCurrency(item.creditLimit)}</span>
                      <span className={styles.available}>Disponível: {formatCurrency(item.availableCredit)}</span>
                    </div>
                  )}
                </div>
                <div className={styles.actions}>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
