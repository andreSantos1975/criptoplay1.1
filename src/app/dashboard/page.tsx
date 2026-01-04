"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { hasPremiumAccess } from "@/lib/permissions";

// PERSONAL FINANCE IMPORTS
import { Income, Expense, Category } from "@/types/personal-finance";
import styles from "./dashboard.module.css";
import { NavigationTabs } from "@/components/dashboard/NavigationTabs/NavigationTabs";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview/DashboardOverview";
import { RecentOperationsTable } from "@/components/dashboard/RecentOperationsTable/RecentOperationsTable";
import MonthSelector from '@/components/dashboard/MonthSelector/MonthSelector';
import { PersonalFinanceNav } from '@/components/dashboard/PersonalFinanceNav/PersonalFinanceNav';
import { OrcamentoPage } from '@/components/dashboard/OrcamentoPage/OrcamentoPage';
import Sidebar from '@/components/dashboard/Sidebar/Sidebar';
import { IncomeTable } from '@/components/dashboard/IncomeTable/IncomeTable';
import { PersonalFinanceTable } from '@/components/dashboard/PersonalFinanceTable/PersonalFinanceTable';
import { PersonalFinanceDialog } from '@/components/dashboard/PersonalFinanceDialog/PersonalFinanceDialog';
import { ReportsSection } from '@/components/dashboard/ReportsSection/ReportsSection';
import { TrialReminderBanner } from '@/components/dashboard/TrialReminderBanner/TrialReminderBanner';

// Dynamically import the Simulator component for the 'analise' tab
const Simulator = dynamic(
  () => import('@/components/simulator/Simulator/Simulator'),
  { ssr: false, loading: () => <p>Carregando Simulador...</p> }
);

// --- TYPE DEFINITIONS ---
interface BudgetCategoryFromApi {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

const DEFAULT_ALLOCATION_PERCENTAGES: { [key: string]: number } = {
  "Investimento": 15,
  "Reserva Financeira": 20,
  "Despesas": 50,
  "Lazer": 10,
  "Outros": 5,
};

// --- API FETCHING FUNCTIONS (PERSONAL FINANCE ONLY) ---
const addIncome = async (newIncome: Omit<Income, 'id'>): Promise<Income> => {
  const response = await fetch("/api/incomes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newIncome) });
  if (!response.ok) throw new Error("Failed to add income");
  return response.json();
};

const updateIncome = async (updatedIncome: Income): Promise<Income> => {
  const response = await fetch(`/api/incomes/${updatedIncome.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedIncome) });
  if (!response.ok) throw new Error("Failed to update income");
  return response.json();
};

const deleteIncome = async (id: string): Promise<void> => {
  const response = await fetch(`/api/incomes/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete income");
};

const addExpense = async (newExpense: Omit<Expense, 'id'>): Promise<Expense> => {
    const response = await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newExpense) });
    if (!response.ok) throw new Error("Failed to add expense");
    return response.json();
};

const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    const response = await fetch(`/api/expenses/${updatedExpense.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updatedExpense) });
    if (!response.ok) throw new Error("Failed to update expense");
    return response.json();
};


// --- MAIN COMPONENT ---
const DashboardPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || "painel";
  const activeFinanceTab = searchParams.get('subtab') || 'movimentacoes';
  
  // --- STATE MANAGEMENT (PERSONAL FINANCE ONLY) ---
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | undefined>();
  const [budgetCategories, setBudgetCategories] = useState<Category[]>([]);
  const [simulatorMode, setSimulatorMode] = useState<'spot' | 'futures'>('spot');

  // --- PERSONAL FINANCE QUERIES & MUTATIONS ---
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth() + 1;

  const { data: fetchedBudgetCategories = [], isLoading: isLoadingBudgetCategories } = useQuery<BudgetCategoryFromApi[]>({
    queryKey: ["budgetCategories"],
    queryFn: async () => {
      const response = await fetch("/api/budget/categories");
      if (!response.ok) throw new Error("Failed to fetch budget categories");
      return response.json();
    },
  });
  
  const { data: expenses = [], isLoading: isLoadingExpenses, isError: isErrorExpenses } = useQuery<Expense[]>({
    queryKey: ['expenses', year, month],
    queryFn: async () => {
      const response = await fetch(`/api/expenses?year=${year}&month=${month}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
  });

  const { data: incomes = [], isLoading: isLoadingIncomes } = useQuery<Income[]>({
    queryKey: ['incomes', year, month],
    queryFn: async () => {
      const response = await fetch(`/api/incomes?year=${year}&month=${month}`);
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
  });

   const addIncomeMutation = useMutation({ 
    mutationFn: addIncome, 
    onSuccess: (newIncome) => { 
      const incomeDate = new Date(newIncome.date);
      const incomeYear = incomeDate.getUTCFullYear();
      const incomeMonth = incomeDate.getUTCMonth() + 1;
      
      // Invalidate the specific month where the income was added
      queryClient.invalidateQueries({ queryKey: ['incomes', incomeYear, incomeMonth] });
      
      // Also invalidate the current view to be safe if it matches
      queryClient.invalidateQueries({ queryKey: ['incomes', year, month] });
      
      setIsIncomeDialogOpen(false); 
      toast.success('Renda adicionada com sucesso!'); 
    }, 
    onError: (error) => { 
      toast.error(`Erro ao adicionar renda: ${error.message}`); 
    }
   });
   const updateIncomeMutation = useMutation({ 
    mutationFn: updateIncome, 
    onSuccess: (updatedIncome) => { 
      const incomeDate = new Date(updatedIncome.date);
      const incomeYear = incomeDate.getUTCFullYear();
      const incomeMonth = incomeDate.getUTCMonth() + 1;

      queryClient.invalidateQueries({ queryKey: ['incomes', incomeYear, incomeMonth] });
      queryClient.invalidateQueries({ queryKey: ['incomes', year, month] });
      
      setIsIncomeDialogOpen(false); 
      toast.success('Renda atualizada com sucesso!'); 
    }, 
    onError: (error) => { 
      toast.error(`Erro ao atualizar renda: ${error.message}`); 
    }
   });
   const deleteIncomeMutation = useMutation({ mutationFn: deleteIncome, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['incomes', year, month] }); toast.success('Renda deletada com sucesso!'); }, onError: () => { toast.error('Erro ao deletar renda.'); } });
   const addExpenseMutation = useMutation({ 
    mutationFn: addExpense, 
    onSuccess: (newExpense) => { 
      const expenseDate = new Date(newExpense.dataVencimento);
      const expenseYear = expenseDate.getUTCFullYear();
      const expenseMonth = expenseDate.getUTCMonth() + 1;

      queryClient.invalidateQueries({ queryKey: ['expenses', expenseYear, expenseMonth] });
      queryClient.invalidateQueries({ queryKey: ['expenses', year, month] });
      
      setIsExpenseDialogOpen(false); 
      toast.success('Despesa adicionada com sucesso!'); 
    }, 
    onError: (error) => { 
      toast.error(`Erro ao adicionar despesa: ${error.message}`); 
    }
   });
   const updateExpenseMutation = useMutation({ 
    mutationFn: updateExpense, 
    onSuccess: (updatedExpense) => { 
      const expenseDate = new Date(updatedExpense.dataVencimento);
      const expenseYear = expenseDate.getUTCFullYear();
      const expenseMonth = expenseDate.getUTCMonth() + 1;

      queryClient.invalidateQueries({ queryKey: ['expenses', expenseYear, expenseMonth] });
      queryClient.invalidateQueries({ queryKey: ['expenses', year, month] });
      
      setIsExpenseDialogOpen(false); 
      toast.success('Despesa atualizada com sucesso!'); 
    }, 
    onError: (error) => { 
      toast.error(`Erro ao atualizar despesa: ${error.message}`); 
    }
   });

  // --- MEMOIZED CALCULATIONS & EFFECTS (PERSONAL FINANCE ONLY) ---
  const processedBudgetCategories = useMemo(() => fetchedBudgetCategories.map(cat => ({ id: cat.id, name: cat.name, percentage: DEFAULT_ALLOCATION_PERCENTAGES[cat.name] || 0, amount: 0, actualSpending: 0 })), [fetchedBudgetCategories]);
  useEffect(() => { if (!isLoadingBudgetCategories && processedBudgetCategories.length > 0) setBudgetCategories(processedBudgetCategories); }, [processedBudgetCategories, isLoadingBudgetCategories]);
  const isBudgetLoading = isLoadingBudgetCategories;
  const totalPercentage = useMemo(() => budgetCategories.reduce((sum, category) => sum + (Number(category.percentage) || 0), 0), [budgetCategories]);
  const totalIncome = useMemo(() => incomes.reduce((sum, i) => sum + i.amount, 0), [incomes]);
  const categoriesWithAmounts = useMemo(() => budgetCategories.map(category => ({ ...category, amount: (totalIncome * (Number(category.percentage) || 0)) / 100 })), [totalIncome, budgetCategories]);
  const categoriesWithSpending = useMemo(() => categoriesWithAmounts.map(category => { const categoryExpenses = expenses.filter(expense => expense.categoria === category.name); const actualSpending = categoryExpenses.reduce((sum, expense) => sum + expense.valor, 0); return { ...category, actualSpending }; }), [categoriesWithAmounts, expenses]);
  const summary = useMemo(() => {
    const pendentes = expenses.filter(e => e.status === 'Pendente');
    const pagos = expenses.filter(e => e.status === 'Pago');
    const totalExpenses = expenses.reduce((sum, e) => sum + e.valor, 0);

    // Encontrar os valores alocados para as categorias específicas
    const expenseCategory = categoriesWithSpending.find(c => c.name === 'Despesas');
    const investmentCategory = categoriesWithSpending.find(c => c.name === 'Investimento');
    const savingsReserveCategory = categoriesWithSpending.find(c => c.name === 'Reserva Financeira');

    const allocatedTotalExpenses = expenseCategory ? expenseCategory.amount : 0;
    const remainingTotalExpenses = allocatedTotalExpenses - totalExpenses;

    // A economia é a soma de todos os 'savedAmount' das despesas onde a economia foi aplicada
    const totalSavings = expenses
      .filter(e => e.applySavingsCalculation && e.savedAmount)
      .reduce((sum, e) => sum + (e.savedAmount || 0), 0);

    return {
      totalPendentes: pendentes.reduce((sum, e) => sum + e.valor, 0),
      totalPagos: pagos.reduce((sum, e) => sum + e.valor, 0),
      totalGeral: totalExpenses,
      countPendentes: pendentes.length,
      countPagos: pagos.length,
      totalIncome: totalIncome,
      balance: totalIncome - totalExpenses,
      expenses,
      allocatedTotalExpenses,
      remainingTotalExpenses,
      totalSavings,
      budgetedEssential: 0,
      actualEssential: 0,
      essentialDifference: 0,
      totalBudgeted: 0,
    };
  }, [expenses, totalIncome, categoriesWithSpending]);
  

  // --- HANDLER FUNCTIONS (PERSONAL FINANCE ONLY) ---
  const handleCategoryChange = (id: string, field: 'name' | 'percentage', value: string | number) => setBudgetCategories(prev => prev.map(cat => cat.id === id ? { ...cat, [field]: value } : cat));
  const handleAddCategory = () => setBudgetCategories(prev => [...prev, { id: Date.now().toString(), name: 'Nova Categoria', percentage: 0, amount: 0, actualSpending: 0 }]);
  const handleRemoveCategory = (id: string) => setBudgetCategories(prev => prev.filter(category => category.id !== id));
  const handleAddExpense = () => { setEditingExpense(undefined); setIsExpenseDialogOpen(true); };
  const handleEditExpense = (expense: Expense) => { setEditingExpense(expense); setIsExpenseDialogOpen(true); };
  const handleAddIncome = () => { setEditingIncome(undefined); setIsIncomeDialogOpen(true); };
  const handleEditIncome = (income: Income) => { setEditingIncome(income); setIsIncomeDialogOpen(true); };
  const handleDeleteIncome = (id: string) => deleteIncomeMutation.mutate(id);
  const handleSaveItem = (item: Omit<Expense, "id"> | Omit<Income, "id">, type: "expense" | "income") => { if (type === 'income') { const payload = { ...item as Omit<Income, "id"> }; payload.date = new Date(payload.date || selectedDate); editingIncome ? updateIncomeMutation.mutate({ ...payload, id: editingIncome.id }) : addIncomeMutation.mutate(payload); } else if (type === 'expense') { const payload = { ...item as Omit<Expense, "id"> }; payload.dataVencimento = new Date(payload.dataVencimento || selectedDate); editingExpense ? updateExpenseMutation.mutate({ ...payload, id: editingExpense.id }) : addExpenseMutation.mutate(payload); } };


  const renderLockedContent = () => (
    <div className={styles.lockedContainer}>
      <div className={styles.lockedContent}>
        <h2>Funcionalidade Premium</h2>
        <p>Esta funcionalidade é exclusiva para assinantes ou durante o período de testes.</p>
        <p>Atualize sua conta para ter acesso completo ao Simulador de Trade, Relatórios Avançados e Cursos Exclusivos.</p>
        <Button onClick={() => router.push('/assinatura')} className={styles.upgradeButton}>
          Assinar Agora
        </Button>
      </div>
    </div>
  );

  // --- RENDER LOGIC ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "painel":
        return (<><DashboardOverview /><div style={{ marginTop: '2rem' }}><RecentOperationsTable /></div></>);
      case "pessoal":
        return (
          <>
            <MonthSelector initialDate={selectedDate} onChange={setSelectedDate} />
            <PersonalFinanceNav activeTab={activeFinanceTab} incomes={incomes} expenses={expenses} />
            {activeFinanceTab === 'orcamento' ? (
              <OrcamentoPage income={summary.totalIncome} categories={categoriesWithSpending} onCategoryChange={handleCategoryChange} onAddCategory={handleAddCategory} onRemoveCategory={handleRemoveCategory} onRestore={() => {}} isLoading={isBudgetLoading} totalPercentage={totalPercentage} />
            ) : (
              <>
                <Sidebar />
                <div className={styles.personalFinanceContainer}>
                  <IncomeTable incomes={incomes} isLoading={isLoadingIncomes} onAddIncome={handleAddIncome} onEditIncome={handleEditIncome} onDeleteIncome={handleDeleteIncome} />
                  <PersonalFinanceTable onAddExpense={handleAddExpense} onEditExpense={handleEditExpense} summary={summary} expenses={expenses} isLoading={isLoadingExpenses} isError={isErrorExpenses} budgetCategories={categoriesWithSpending} />
                  <PersonalFinanceDialog 
                    isOpen={isExpenseDialogOpen || isIncomeDialogOpen} 
                    onClose={() => { setIsExpenseDialogOpen(false); setIsIncomeDialogOpen(false); }} 
                    onSave={handleSaveItem} 
                    item={editingExpense || editingIncome} 
                    type={isExpenseDialogOpen ? "expense" : "income"} 
                    isLoading={addIncomeMutation.isPending || updateIncomeMutation.isPending || addExpenseMutation.isPending || updateExpenseMutation.isPending}
                  />
                </div>
              </>
            )}
          </>
        );
      case "analise": {
        if (!hasPremiumAccess(session)) return renderLockedContent();

        // Renaming original simulator for clarity
        const SpotSimulator = dynamic(
          () => import('@/components/simulator/Simulator/Simulator'),
          { ssr: false, loading: () => <p>Carregando Simulador...</p> }
        );

        const FuturesSimulator = dynamic(
          () => import('@/components/simulator/FuturesSimulator/FuturesSimulator'),
          { ssr: false, loading: () => <p>Carregando Simulador de Futuros...</p> }
        );
        
        return (
          <div>
            <div className={styles.simulatorToggle}>
              <button 
                onClick={() => setSimulatorMode('spot')}
                className={simulatorMode === 'spot' ? styles.activeToggle : ''}
              >
                Mercado Spot
              </button>
              <button 
                onClick={() => setSimulatorMode('futures')}
                className={simulatorMode === 'futures' ? styles.activeToggle : ''}
              >
                Mercado Futuros
              </button>
            </div>
            {simulatorMode === 'spot' ? <SpotSimulator /> : <FuturesSimulator />}
          </div>
        );
      }
      case "relatorios":
        if (!hasPremiumAccess(session)) return renderLockedContent();
        return <ReportsSection />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Bem-vindo à sua plataforma de gestão</h1>
          <p className={styles.subtitle}>Acompanhe seus resultados, finanças e simulações em tempo real</p>
        </header>

        <TrialReminderBanner /> {/* Adicionar o banner aqui */}

        <div className={styles.tabs}>
          <NavigationTabs activeTab={activeTab} />
        </div>

        <section className={styles.tabContent}>
          {renderTabContent()}
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;