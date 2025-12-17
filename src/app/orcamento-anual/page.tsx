"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "./orcamento-anual.module.css";
import { CategoryModal } from "@/components/budget/CategoryModal";

// Tipos correspondentes ao nosso schema Prisma
interface BudgetCategory {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

interface BudgetItem {
  id: string;
  categoryId: string;
  month: number;
  amount: number;
}

// --- Funções de API ---
const fetchBudgetCategories = async (): Promise<BudgetCategory[]> => {
  const res = await fetch("/api/budget/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
};

const fetchBudgetItems = async (year: number): Promise<BudgetItem[]> => {
  const res = await fetch(`/api/budget/items?year=${year}`);
  if (!res.ok) throw new Error("Failed to fetch budget items");
  return res.json();
};

const upsertBudgetItem = async (item: {
  year: number;
  month: number;
  categoryId: string;
  amount: number;
}) => {
  const res = await fetch("/api/budget/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to save item");
  return res.json();
};

const deleteCategory = async (categoryId: string) => {
    const res = await fetch(`/api/budget/categories/${categoryId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Failed to delete category");
    }
    return res.json();
  };

// --- Componente Principal ---
export default function OrcamentoAnualPage() {
  const queryClient = useQueryClient();
  const [year, setYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<BudgetCategory | null>(null);


  // --- Queries ---
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery<BudgetCategory[]>({
    queryKey: ["budgetCategories"],
    queryFn: fetchBudgetCategories,
  });

  const { data: items = [], isLoading: isLoadingItems } = useQuery<BudgetItem[]>({
    queryKey: ["budgetItems", year],
    queryFn: () => fetchBudgetItems(year),
  });

  // --- Mutações ---
  const upsertItemMutation = useMutation({
    mutationFn: upsertBudgetItem,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<BudgetItem[]>(["budgetItems", year], (oldData) => {
        const oldItems = oldData || [];
        const existingItemIndex = oldItems.findIndex(
          (item) =>
            item.categoryId === variables.categoryId && item.month === variables.month
        );
        if (existingItemIndex !== -1) {
          const updatedItems = [...oldItems];
          updatedItems[existingItemIndex] = { ...updatedItems[existingItemIndex], amount: variables.amount };
          return updatedItems;
        }
        return [...oldItems, data];
      });
    },
    onError: (error) => {
      console.error("Failed to save budget item:", error);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgetCategories"] });
      queryClient.invalidateQueries({ queryKey: ["budgetItems", year] });
    },
    onError: (error: Error) => {
      alert(`Falha ao excluir categoria: ${error.message}`);
    },
  });

  // --- Processamento de Dados ---
  const gridData = useMemo(() => {
    const data: { [categoryId: string]: { [month: number]: number } } = {};
    items.forEach((item) => {
      if (!data[item.categoryId]) {
        data[item.categoryId] = {};
      }
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
    const totals = Array(12).fill(null).map(() => ({
      income: 0,
      totalExpense: 0,
      balance: 0,
      expensesByCategory: {} as { [categoryId: string]: number },
    }));

    items.forEach(item => {
      const category = categories.find(c => c.id === item.categoryId);
      if (category) {
        const monthIndex = item.month - 1;
        if (category.type === 'INCOME') {
          totals[monthIndex].income += item.amount;
        } else { // EXPENSE
          totals[monthIndex].totalExpense += item.amount;
          totals[monthIndex].expensesByCategory[category.id] = (totals[monthIndex].expensesByCategory[category.id] || 0) + item.amount;
        }
      }
    });

    totals.forEach(monthTotal => {
      monthTotal.balance = monthTotal.income - monthTotal.totalExpense;
    });

    return totals;
  }, [items, categories]);

  // --- Handlers ---
  const handleInputChange = (
    categoryId: string,
    month: number,
    value: string
  ) => {
    const amount = parseFloat(value) || 0;
    upsertItemMutation.mutate({ year, month, categoryId, amount });
  };

  const handleOpenCreateModal = () => {
    setCategoryToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: BudgetCategory) => {
    setCategoryToEdit(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCategoryToEdit(null); // Always reset after closing
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta categoria? Todos os dados orçamentários associados a ela serão perdidos permanentemente.")) {
        deleteCategoryMutation.mutate(categoryId);
    }
  };

  // --- Renderização ---
  const monthLabels = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez",
  ];

  const renderCategoryRows = (type: "INCOME" | "EXPENSE") => {
    const filteredCategories = type === 'INCOME' ? incomeCategories : expenseCategories;
    
    if (filteredCategories.length === 0) {
        return (
            <tr>
                <td colSpan={14} className={styles.emptyRow}>
                    Nenhuma categoria de {type === "INCOME" ? "receita" : "despesa"} encontrada. Adicione uma nova para começar.
                </td>
            </tr>
        )
    }

    return filteredCategories.map((category) => {
      const monthlyValues = gridData[category.id] || {};
      const total = Object.values(monthlyValues).reduce((sum, val) => sum + val, 0);

      return (
        <tr key={category.id}>
          <td className={styles.categoryNameCell}>
            <span>{category.name}</span>
            <div className={styles.categoryActions}>
                <button onClick={() => handleOpenEditModal(category)} className={styles.actionButton}>Editar</button>
                <button onClick={() => handleDeleteCategory(category.id)} className={styles.actionButton}>Excluir</button>
            </div>
          </td>
          {monthLabels.map((_, index) => {
            const month = index + 1;
            return (
              <td key={month}>
                <input
                  type="number"
                  className={styles.inputCell}
                  defaultValue={monthlyValues[month] || ""}
                  onBlur={(e) => handleInputChange(category.id, month, e.target.value)}
                  placeholder="0"
                />
              </td>
            );
          })}
          <td className={styles.totalCell}>{total.toFixed(2)}</td>
        </tr>
      );
    });
  };

  if (isLoadingCategories || isLoadingItems) {
    return <div>Carregando orçamento...</div>;
  }

  return (
    <>
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["budgetCategories"] });
        }}
        categoryToEdit={categoryToEdit}
      />
      <div className={styles.container}>
        <Link href="/dashboard?tab=pessoal" className={styles.backLink}>
          ‹ Voltar para Finanças Pessoais
        </Link>
        <header className={styles.header}>
          <h1>Orçamento Anual</h1>
          <div className={styles.yearSelector}>
            <button onClick={() => setYear(year - 1)}>{"<"}</button>
            <span>{year}</span>
            <button onClick={() => setYear(year + 1)}>{">"}</button>
          </div>
        </header>

        <button className={styles.addButton} onClick={handleOpenCreateModal}>
          + Nova Categoria
        </button>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Categoria</th>
                {monthLabels.map((label) => (
                  <th key={label}>{label}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.sectionHeader}><td colSpan={14}>Receitas</td></tr>
              {renderCategoryRows("INCOME")}
              <tr className={styles.sectionHeader}><td colSpan={14}>Despesas</td></tr>
              {renderCategoryRows("EXPENSE")}
            </tbody>
            <tfoot>
                <tr className={styles.footerRow}>
                    <td className={styles.footerHeader}>Total Receitas</td>
                    {monthlyTotals.map((total, i) => <td key={i}>{total.income.toFixed(2)}</td>)}
                    <td>{monthlyTotals.reduce((acc, t) => acc + t.income, 0).toFixed(2)}</td>
                </tr>
                
                {expenseCategories.map(category => {
                  const categoryTotal = monthlyTotals.reduce((acc, month) => acc + (month.expensesByCategory[category.id] || 0), 0);
                  return (
                    <tr key={category.id} className={styles.footerRow}>
                      <td className={styles.footerHeader}>{category.name}</td>
                      {monthlyTotals.map((total, i) => <td key={i}>{(total.expensesByCategory[category.id] || 0).toFixed(2)}</td>)}
                      <td>{categoryTotal.toFixed(2)}</td>
                    </tr>
                  )
                })}

                <tr className={styles.balanceRow}>
                    <td className={styles.footerHeader}>Saldo Mensal</td>
                    {monthlyTotals.map((total, i) => (
                        <td key={i} className={total.balance < 0 ? styles.negative : styles.positive}>
                            {total.balance.toFixed(2)}
                        </td>
                    ))}
                    <td className={monthlyTotals.reduce((acc, t) => acc + t.balance, 0) < 0 ? styles.negative : styles.positive}>
                        {monthlyTotals.reduce((acc, t) => acc + t.balance, 0).toFixed(2)}
                    </td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
