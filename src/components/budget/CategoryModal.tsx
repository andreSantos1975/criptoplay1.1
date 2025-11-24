"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import Modal from "@/components/ui/modal/Modal";
import styles from "./CategoryModal.module.css";

// --- Type Definitions ---
interface BudgetCategory {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: BudgetCategory | null;
}

type CreatePayload = Omit<BudgetCategory, "id">;
type UpdatePayload = BudgetCategory;

// --- API Functions ---
const createCategory = async (data: CreatePayload) => {
  const res = await fetch("/api/budget/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to create category");
  }
  return res.json();
};

const updateCategory = async (data: UpdatePayload) => {
    const { id, ...updateData } = data;
    const res = await fetch(`/api/budget/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to update category");
    }
    return res.json();
  };

// --- Component ---
export function CategoryModal({ isOpen, onClose, onSuccess, categoryToEdit }: CategoryModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!categoryToEdit;

  useEffect(() => {
    if (isOpen) {
        if (isEditMode) {
            setName(categoryToEdit.name);
            setType(categoryToEdit.type);
        } else {
            // Reset for create mode
            setName("");
            setType("EXPENSE");
        }
        setError(null);
    }
  }, [isOpen, isEditMode, categoryToEdit]);


  const mutation = useMutation({
    mutationFn: (data: CreatePayload | UpdatePayload) => 
        isEditMode 
            ? updateCategory(data as UpdatePayload) 
            : createCategory(data as CreatePayload),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome da categoria é obrigatório.");
      return;
    }
    setError(null);

    const data = isEditMode
        ? { id: categoryToEdit.id, name, type }
        : { name, type };

    mutation.mutate(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Editar Categoria" : "Nova Categoria"}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formGroup}>
          <label htmlFor="category-name">Nome</label>
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Supermercado"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="category-type">Tipo</label>
          <select
            id="category-type"
            value={type}
            onChange={(e) => setType(e.target.value as "INCOME" | "EXPENSE")}
          >
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita</option>
          </select>
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={styles.saveButton} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : (isEditMode ? "Salvar Alterações" : "Salvar")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
