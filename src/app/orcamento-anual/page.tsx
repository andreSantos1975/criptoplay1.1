"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import styles from "./orcamento-anual.module.css";
import { CategoryModal } from "@/components/budget/CategoryModal";
import { PremiumLock } from "@/components/ui/PremiumLock";

// Tipos e Funções de API (omitidos por brevidade, permanecem os mesmos)
interface BudgetCategory { id: string; name: string; type: "INCOME" | "EXPENSE"; }
interface BudgetItem { id: string; categoryId: string; month: number; amount: number; }
const fetchBudgetCategories = async (): Promise<BudgetCategory[]> => { const res = await fetch("/api/budget/categories"); if (!res.ok) throw new Error("Failed to fetch categories"); return res.json(); };
const fetchBudgetItems = async (year: number): Promise<BudgetItem[]> => { const res = await fetch(`/api/budget/items?year=${year}`); if (!res.ok) throw new Error("Failed to fetch budget items"); return res.json(); };
const upsertBudgetItem = async (item: { year: number; month: number; categoryId: string; amount: number; }) => { const res = await fetch("/api/budget/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item), }); if (!res.ok) throw new Error("Failed to save item"); return res.json(); };
const deleteCategory = async (categoryId: string) => { const res = await fetch(`/api/budget/categories/${categoryId}`, { method: "DELETE" }); if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.error || "Failed to delete category"); } return res.json(); };

export default function OrcamentoAnualPage() {
  // 1. TODOS os hooks são declarados no topo, incondicionalmente.
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<BudgetCategory | null>(null);

  const permissions = session?.user?.permissions;

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<BudgetCategory[]>({
    queryKey: ["budgetCategories"],
    queryFn: fetchBudgetCategories,
    enabled: permissions?.isPremium,
  });

  const { data: items = [], isLoading: isLoadingItems } = useQuery<BudgetItem[]>({
    queryKey: ["budgetItems", year],
    queryFn: () => fetchBudgetItems(year),
    enabled: permissions?.isPremium,
  });

  const upsertItemMutation = useMutation({
    mutationFn: upsertBudgetItem,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<BudgetItem[]>(["budgetItems", year], (oldData) => {
        const oldItems = oldData || [];
        const existingItemIndex = oldItems.findIndex((item) => item.categoryId === variables.categoryId && item.month === variables.month);
        if (existingItemIndex !== -1) {
          const updatedItems = [...oldItems];
          updatedItems[existingItemIndex] = { ...updatedItems[existingItemIndex], amount: variables.amount };
          return updatedItems;
        }
        return [...oldItems, data];
      });
    },
    onError: (error) => console.error("Failed to save budget item:", error),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgetCategories"] });
      queryClient.invalidateQueries({ queryKey: ["budgetItems", year] });
    },
    onError: (error: Error) => alert(`Falha ao excluir categoria: ${error.message}`),
  });

  const gridData = useMemo(() => {
    const data: { [categoryId: string]: { [month: number]: number } } = {};
    items.forEach((item) => {
      if (!data[item.categoryId]) data[item.categoryId] = {};
      data[item.categoryId][item.month] = item.amount;
    });
    return data;
  }, [items]);

  const { expenseCategories, incomeCategories } = useMemo(() => {
    const expenseCats = categories.filter(c => c.type === 'EXPENSE');
    const incomeCats = categories.filter(c => c.type === 'INCOME');
    return { expenseCategories: expenseCats, incomeCategories: incomeCats };
  }, [categories]);
  
  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(null).map(() => ({ income: 0, totalExpense: 0, balance: 0, expensesByCategory: {} as { [categoryId: string]: number } }));
    items.forEach(item => {
      const category = categories.find(c => c.id === item.categoryId);
      if (category) {
        const monthIndex = item.month - 1;
        if (category.type === 'INCOME') totals[monthIndex].income += item.amount;
        else { totals[monthIndex].totalExpense += item.amount; totals[monthIndex].expensesByCategory[category.id] = (totals[monthIndex].expensesByCategory[category.id] || 0) + item.amount; }
      }
    });
    totals.forEach(monthTotal => { monthTotal.balance = monthTotal.income - monthTotal.totalExpense; });
    return totals;
  }, [items, categories]);

  // 2. As verificações e retornos antecipados vêm DEPOIS dos hooks.
  if (status === 'loading' || isLoadingCategories || isLoadingItems) {
    return <div>Carregando...</div>;
  }

  if (!permissions?.isPremium) {
    return (
      <div className={styles.container}>
        <PremiumLock 
          title="Orçamento Anual Inteligente"
          message="Planeje seu ano financeiro, defina tetos de gastos por categoria e veja seu progresso mês a mês. Funcionalidade exclusiva para assinantes PRO."
        />
      </div>
    );
  }
  
  // Handlers e lógica de renderização (inalterados, omitidos por brevidade)
  const handleInputChange = (categoryId: string, month: number, value: string) => { /* ... */ };
  const handleOpenCreateModal = () => { /* ... */ };
  // ...

  // 3. A renderização principal acontece no final.
  return (
    <>
      <CategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["budgetCategories"] })} categoryToEdit={categoryToEdit} />
      <div className={styles.container}>
        <Link href="/dashboard?tab=pessoal" className={styles.backLink}>‹ Voltar para Finanças Pessoais</Link>
        <header className={styles.header}>
          <h1>Orçamento Anual</h1>
          <div className={styles.yearSelector}>
            <button onClick={() => setYear(year - 1)}>{"<"}</button>
            <span>{year}</span>
            <button onClick={() => setYear(year + 1)}>{">"}</button>
          </div>
        </header>
        <button className={styles.addButton} onClick={handleOpenCreateModal}>+ Nova Categoria</button>
        <div className={styles.tableContainer}>
           {/* ... Tabela ... */}
        </div>
      </div>
    </>
  );
}
