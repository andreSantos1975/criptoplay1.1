"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Modal from "@/components/ui/modal/Modal";
import styles from "./CategoryModal.module.css";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const createCategory = async (data: { name: string; type: "INCOME" | "EXPENSE" }) => {
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

export function CategoryModal({ isOpen, onClose, onSuccess }: CategoryModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      onSuccess(); // Callback to refetch categories
      handleClose();
    },
    onError: (e: Error) => {
      setError(e.message);
    },
  });

  const handleClose = () => {
    setName("");
    setType("EXPENSE");
    setError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome da categoria é obrigatório.");
      return;
    }
    setError(null);
    mutation.mutate({ name, type });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nova Categoria">
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
          <button type="button" className={styles.cancelButton} onClick={handleClose}>
            Cancelar
          </button>
          <button type="submit" className={styles.saveButton} disabled={mutation.isPending}>
            {mutation.isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
