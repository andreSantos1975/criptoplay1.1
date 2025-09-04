"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from 'react-hot-toast';

import { NavigationTabs } from "@/components/dashboard/NavigationTabs/NavigationTabs";
import { PersonalFinanceTable } from "@/components/dashboard/PersonalFinanceTable/PersonalFinanceTable";
import { RecentOperationsTable } from "@/components/dashboard/RecentOperationsTable/RecentOperationsTable";
import { IncomeTable } from "@/components/dashboard/IncomeTable/IncomeTable";
import { PersonalFinanceDialog } from "@/components/dashboard/PersonalFinanceDialog/PersonalFinanceDialog";
import { Expense, Income } from "@/types/personal-finance";
import dynamic from "next/dynamic";
import TradeJournal from "@/components/dashboard/TradeJournal/TradeJournal";
import AssetHeader from "@/components/dashboard/AssetHeader/AssetHeader";
import Sidebar from "@/components/dashboard/Sidebar/Sidebar";
import { PersonalFinanceNav } from "@/components/dashboard/PersonalFinanceNav/PersonalFinanceNav";
import { OrcamentoPage } from "@/components/dashboard/OrcamentoPage/OrcamentoPage";
import { Category } from "@/components/dashboard/CategoryAllocation/CategoryAllocation";


const TechnicalAnalysisChart = dynamic(
  () =>
    import("@/components/dashboard/TechnicalAnalysisChart/TechnicalAnalysisChart").then(
      (mod) => mod.TechnicalAnalysisChart
    ),
  { ssr: false }
);
import { ReportsSection } from "@/components/dashboard/ReportsSection/ReportsSection";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview/DashboardOverview";
import styles from "./dashboard.module.css";

type BinanceKline = [
  number, // Open time
  string, // Open
  string, // High
  string, // Low
  string, // Close
  string, // Volume
  number, // Close time
  string, // Quote asset volume
  number, // Number of trades
  string, // Taker buy base asset volume
  string, // Taker buy quote asset volume
  string, // Ignore
];

// API Functions
const addIncome = async (newIncome: Omit<Income, 'id'>): Promise<Income> => {
  const response = await fetch("/api/incomes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newIncome),
  });
  if (!response.ok) {
    throw new Error("Failed to add income");
  }
  return response.json();
};

const updateIncome = async (updatedIncome: Income): Promise<Income> => {
  const response = await fetch(`/api/incomes/${updatedIncome.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updatedIncome),
  });
  if (!response.ok) {
    throw new Error("Failed to update income");
  }
  return response.json();
};

const addExpense = async (newExpense: Omit<Expense, 'id'>): Promise<Expense> => {
    const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense),
    });
    if (!response.ok) throw new Error("Failed to add expense");
    return response.json();
};

const updateExpense = async (updatedExpense: Expense): Promise<Expense> => {
    const response = await fetch(`/api/expenses/${updatedExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedExpense),
    });
    if (!response.ok) throw new Error("Failed to update expense");
    return response.json();
};


const DashboardPage = () => {
  const queryClient = useQueryClient();
    const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || "painel";
    const activeFinanceTab = searchParams.get('subtab') || 'movimentacoes';
  const [klines, setKlines] = useState<BinanceKline[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTCUSDT');
  const [marketType, setMarketType] = useState('spot'); // 'spot' or 'futures'
  const [tipoOperacao, setTipoOperacao] = useState('compra');

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | undefined>();

  // State lifted from OrcamentoPage
  const [budgetCategories, setBudgetCategories] = useState<Category[]>([
    { id: '1', name: 'Investimentos', percentage: 20, amount: 0 },
    { id: '2', name: 'Reserva Financeira', percentage: 15, amount: 0 },
    { id: '3', name: 'Despesas Essenciais', percentage: 50, amount: 0 },
    { id: '4', name: 'Lazer', percentage: 10, amount: 0 },
    { id: '5', name: 'Outros', percentage: 5, amount: 0 },
  ]);
  const [isBudgetLoading, setIsBudgetLoading] = useState(false);
  const [budgetFetched, setBudgetFetched] = useState(false);

  // Logic lifted from OrcamentoPage
  const fetchBudget = useCallback(async () => {
    setIsBudgetLoading(true);
    try {
      const response = await fetch('/api/budget');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          // No longer setting budgetIncome, as it's derived from totalIncome
          setBudgetCategories(data.categories.map((cat: { id?: string; name: string; percentage: number }, index: number) => ({
            ...cat,
            id: cat.id || index.toString(),
            // Amount will be calculated based on totalIncome later
            amount: 0, // Placeholder, will be updated by the useEffect below
          })));
        } else {
          // If no budget is found, reset to a default state
          setBudgetCategories([
            { id: '1', name: 'Investimentos', percentage: 20, amount: 0 },
            { id: '2', name: 'Reserva Financeira', percentage: 15, amount: 0 },
            { id: '3', name: 'Despesas Essenciais', percentage: 50, amount: 0 },
            { id: '4', name: 'Lazer', percentage: 10, amount: 0 },
            { id: '5', name: 'Outros', percentage: 5, amount: 0 },
          ]);
        }
        setBudgetFetched(true); // Mark as fetched
      }
    } catch (error) {
      console.error("Failed to fetch budget:", error);
    } finally {
      setIsBudgetLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch budget data if it hasn't been fetched yet, regardless of the tab
    if (!budgetFetched) {
      fetchBudget();
    }
  }, [budgetFetched, fetchBudget]);

  // Calculate total percentage (still useful for OrcamentoPage)
  const totalPercentage = useMemo(() => {
    return budgetCategories.reduce((sum, category) => sum + (Number(category.percentage) || 0), 0);
  }, [budgetCategories]);

  const { data: expenses = [], isLoading: isLoadingExpenses, isError: isErrorExpenses } = useQuery<Expense[]>({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await fetch("/api/expenses");
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
  });

  const { data: incomes = [] } = useQuery<Income[]>({
    queryKey: ['incomes'],
    queryFn: async () => {
      const response = await fetch("/api/incomes");
      if (!response.ok) throw new Error("Network response was not ok");
      return response.json();
    },
  });

  const summary = useMemo(() => {
    const pendentes = expenses.filter(e => e.status === 'Pendente');
    const pagos = expenses.filter(e => e.status === 'Pago');
    const totalExpenses = expenses.reduce((sum, e) => sum + e.valor, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalSavings = expenses.reduce((sum, e) => sum + (e.savedAmount || 0), 0);

    return {
      totalPendentes: pendentes.reduce((sum, e) => sum + e.valor, 0),
      totalPagos: pagos.reduce((sum, e) => sum + e.valor, 0),
      totalGeral: totalExpenses,
      countPendentes: pendentes.length,
      countPagos: pagos.length,
      totalIncome: totalIncome,
      balance: totalIncome - totalExpenses,
      totalSavings,
    };
  }, [expenses, incomes]);

  const categoriesWithAmounts = useMemo(() => {
    return budgetCategories.map(category => ({
      ...category,
      amount: (summary.totalIncome * (Number(category.percentage) || 0)) / 100
    }));
  }, [summary.totalIncome, budgetCategories]);

  const handleCategoryChange = (id: string, field: 'name' | 'percentage', value: string | number) => {
    setBudgetCategories(prevCategories => {
      const updatedCategories = prevCategories.map(category => {
        if (category.id === id) {
          const updatedCategory = { ...category, [field]: value };
          // A lógica de cálculo do amount foi removida daqui para ser centralizada no useMemo
          return updatedCategory;
        }
        return category;
      });
      return updatedCategories;
    });
  };

  const handleAddCategory = () => {
    const newId = Date.now().toString();
    const newCategory: Category = { id: newId, name: 'Nova Categoria', percentage: 0, amount: 0 };
    setBudgetCategories(prev => [...prev, newCategory]);
  };

  const handleRemoveCategory = (id: string) => {
    setBudgetCategories(prev => prev.filter(category => category.id !== id));
  };

  const handleSaveBudget = useCallback(async () => {
    setIsBudgetLoading(true);
    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          income: summary.totalIncome, // Now uses actual total income
          categories: budgetCategories.map(({ name, percentage }) => ({ name, percentage })),
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        }),
      });
      if (!response.ok) throw new Error('Failed to save budget');
      toast.success('Orçamento salvo com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar orçamento.');
    } finally {
      setIsBudgetLoading(false);
    }
  }, [summary.totalIncome, budgetCategories]); // Dependency updated

  

  const addExpenseMutation = useMutation({
    mutationFn: addExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsExpenseDialogOpen(false);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsExpenseDialogOpen(false);
    },
  });

  

  const { data: exchangeRateData } = useQuery({
    queryKey: ["exchangeRate"],
    queryFn: async () => {
      const response = await fetch("/api/exchange-rate");
      if (!response.ok) throw new Error("Failed to fetch exchange rate");
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const [tradeLevels, setTradeLevels] = useState(() => {
    const savedLevels = typeof window !== 'undefined' ? localStorage.getItem('tradeLevels') : null;
    return savedLevels ? JSON.parse(savedLevels) : {
      entry: 65500,
      takeProfit: 68000,
      stopLoss: 64000,
    };
  });

  useEffect(() => {
    const fetchAndSetInitialLevels = async () => {
      try {
        const response = await fetch(`/api/binance/klines?symbol=${selectedCrypto}&interval=1d`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setKlines(data);
        if (data && data.length > 0) {
          const lastPrice = parseFloat(data[data.length - 1][4]);
          const newLevels = {
            entry: lastPrice,
            takeProfit: lastPrice * 1.02,
            stopLoss: lastPrice * 0.98,
          };
          setTradeLevels(newLevels);
        }
      } catch (error) {
        console.error("Failed to fetch initial crypto price:", error);
      }
    };

    fetchAndSetInitialLevels();
  }, [selectedCrypto]);

  useEffect(() => {
    localStorage.setItem('tradeLevels', JSON.stringify(tradeLevels));
  }, [tradeLevels]);

  const handleCryptoSelect = (symbol: string) => {
    setSelectedCrypto(symbol);
  };

  const handleAddExpense = () => {
    setEditingExpense(undefined);
    setIsExpenseDialogOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };

  const handleAddIncome = () => {
    setEditingIncome(undefined);
    setIsIncomeDialogOpen(true);
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setIsIncomeDialogOpen(true);
  };

  const handleSaveItem = (item: Omit<Expense, "id"> | Omit<Income, "id">, type: "expense" | "income") => {
    if (type === 'income') {
      if (editingIncome) {
        updateIncomeMutation.mutate({ ...item, id: editingIncome.id } as Income);
      } else {
        addIncomeMutation.mutate(item as Omit<Income, 'id'>);
      }
    } else if (type === 'expense') {
      if (editingExpense) {
        updateExpenseMutation.mutate({ ...item, id: editingExpense.id } as Expense);
      } else {
        addExpenseMutation.mutate(item as Omit<Expense, 'id'>);
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "painel":
        return (
          <>
            <DashboardOverview />
            <div style={{ marginTop: '2rem' }}>
              <RecentOperationsTable />
            </div>
          </>
        );
      case "pessoal":
        return (
          <>
            <PersonalFinanceNav activeTab={activeFinanceTab} />
            {activeFinanceTab === 'orcamento' ? (
              <OrcamentoPage 
                income={summary.totalIncome} // Now uses actual total income
                categories={categoriesWithAmounts}
                onCategoryChange={handleCategoryChange}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
                onSaveBudget={handleSaveBudget}
                onRestore={fetchBudget}
                isLoading={isBudgetLoading}
                totalPercentage={totalPercentage}
              />
            ) : (
              <>
                <Sidebar />
                <div className={styles.personalFinanceContainer}>
                  <IncomeTable
                    onAddIncome={handleAddIncome}
                    onEditIncome={handleEditIncome}
                  />
                  <PersonalFinanceTable
                    onAddExpense={handleAddExpense}
                    onEditExpense={handleEditExpense}
                    summary={summary}
                    expenses={expenses}
                    isLoading={isLoadingExpenses}
                    isError={isErrorExpenses}
                    budgetCategories={categoriesWithAmounts}
                  />
                  <PersonalFinanceDialog
                    isOpen={isExpenseDialogOpen || isIncomeDialogOpen}
                    onClose={() => {
                      setIsExpenseDialogOpen(false);
                      setIsIncomeDialogOpen(false);
                    }}
                    onSave={handleSaveItem}
                    item={editingExpense || editingIncome}
                    type={isExpenseDialogOpen ? "expense" : "income"}
                  />
                </div>
              </>
            )}
          </>
        );
      case "analise":
        const latestKline = klines && klines.length > 0 ? klines[klines.length - 1] : null;
        const brlRate = exchangeRateData?.usdtToBrl || 1; // Default to 1 if rate not available
        return (
          <>
            {latestKline && (
              <AssetHeader
                symbol={selectedCrypto}
                price={parseFloat(latestKline[4])}
                open={parseFloat(latestKline[1])}
                high={parseFloat(latestKline[2])}
                low={parseFloat(latestKline[3])}
                brlRate={brlRate}
              />
            )}
            <TechnicalAnalysisChart
              tradeLevels={tradeLevels}
              onLevelsChange={setTradeLevels}
              selectedCrypto={selectedCrypto}
              onCryptoSelect={handleCryptoSelect}
              marketType={marketType}
              onMarketTypeChange={setMarketType}
              tipoOperacao={tipoOperacao} // Pass new prop
            >
              <TradeJournal 
                tradeLevels={tradeLevels} 
                selectedCrypto={selectedCrypto}
                tipoOperacao={tipoOperacao} // Pass new prop
                onTipoOperacaoChange={setTipoOperacao} // Pass new prop
              />
            </TechnicalAnalysisChart>
          </>
        );
      case "relatorios":
        return <ReportsSection />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            Bem-vindo à sua plataforma de gestão de trades
          </h1>
          <p className={styles.subtitle}>
            Acompanhe seus resultados, operações e aportes em tempo real
          </p>
        </header>

        <section className={styles.kpiGrid}>
          {/* ... KPICards ... */}
        </section>

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