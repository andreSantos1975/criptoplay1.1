
'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import styles from './AccountCardManagement.module.css';
import { BankAccount, CreditCard } from '@prisma/client';
import { AccountCardList } from '../AccountCardList/AccountCardList';
import { AccountCardForm } from '../AccountCardForm/AccountCardForm';
import { Button } from '@/components/ui/button';

// API Functions
const addItem = async ({ type, data }: { type: 'account' | 'card'; data: any }) => {
  const url = type === 'account' ? '/api/accounts' : '/api/credit-cards';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Falha ao adicionar ${type === 'account' ? 'conta' : 'cartão'}.`);
  return response.json();
};

const updateItem = async ({ id, type, data }: { id: string, type: 'account' | 'card', data: any }) => {
  const url = type === 'account' ? `/api/accounts/${id}` : `/api/credit-cards/${id}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Falha ao atualizar ${type === 'account' ? 'conta' : 'cartão'}.`);
  return response.json();
};

const deleteItem = async ({ id, type }: { id: string, type: 'account' | 'card' }) => {
  const url = type === 'account' ? `/api/accounts/${id}` : `/api/credit-cards/${id}`;
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok) throw new Error('Falha ao excluir item.');
  return response.json();
};


interface AccountCardManagementProps {
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
}

export function AccountCardManagement({ bankAccounts, creditCards }: AccountCardManagementProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'account' | 'card' | null>(null);
  const [editingItem, setEditingItem] = useState<BankAccount | CreditCard | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'account' | 'card' } | null>(null);

  const handleOpenModal = (type: 'account' | 'card', item: BankAccount | CreditCard | null = null) => {
    setModalType(type);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setEditingItem(null);
  };

  const addMutation = useMutation({
    mutationFn: addItem,
    onSuccess: (_, variables) => {
      toast.success(`${variables.type === 'account' ? 'Conta' : 'Cartão'} adicionado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: [variables.type === 'account' ? 'bankAccounts' : 'creditCards'] });
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateItem,
    onSuccess: (_, variables) => {
      toast.success(`${variables.type === 'account' ? 'Conta' : 'Cartão'} atualizado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: [variables.type === 'account' ? 'bankAccounts' : 'creditCards'] });
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: (_, variables) => {
      toast.success('Item excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: [variables.type === 'account' ? 'bankAccounts' : 'creditCards'] });
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: string, type: 'account' | 'card') => {
    setItemToDelete({ id, type });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  const handleSave = (data: any) => {
    if (!modalType) return;

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, type: modalType, data });
    } else {
      addMutation.mutate({ type: modalType, data });
    }
  };

  return (
    <div className={styles.managementContainer}>
      <AccountCardList
        title="Contas Bancárias"
        items={bankAccounts}
        onAdd={() => handleOpenModal('account')}
        onEdit={(item) => handleOpenModal('account', item)}
        onDelete={(id) => handleDelete(id, 'account')}
        type="account"
      />
      <AccountCardList
        title="Cartões de Crédito"
        items={creditCards}
        onAdd={() => handleOpenModal('card')}
        onEdit={(item) => handleOpenModal('card', item)}
        onDelete={(id) => handleDelete(id, 'card')}
        type="card"
      />

      {isModalOpen && modalType && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>{`${editingItem ? 'Editar' : 'Adicionar Novo'} ${modalType === 'account' ? 'Conta' : 'Cartão'}`}</h2>
            <AccountCardForm
              type={modalType}
              onClose={handleCloseModal}
              onSave={handleSave}
              isLoading={addMutation.isPending || updateMutation.isPending}
              initialData={editingItem}
            />
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Confirmar Exclusão</h2>
            <p>Tem certeza de que deseja excluir este item? Esta ação não pode ser desfeita.</p>
            <div className={styles.confirmActions}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
