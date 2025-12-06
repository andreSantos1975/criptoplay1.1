"use client";

import { useState, useEffect, useMemo } from "react";
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
import MonthSelector from "@/components/dashboard/MonthSelector/MonthSelector";


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

const DEFAULT_ALLOCATION_PERCENTAGES: { [key: string]: number } = {
  "Investimento": 15,
  "Reserva Financeira": 20,
  "Despesas": 50, // Assuming "Despesas Essenciais" or general expenses
  "Lazer": 10,
  "Outros": 5,
};

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

interface BudgetCategoryFromApi {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

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

const deleteIncome = async (id: string): Promise<void> => {
  const response = await fetch(`/api/incomes/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete income");
  }
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
  
  // Date state for filtering
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [selectedCrypto, setSelectedCrypto] = useState<string>('BTCBRL');
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('spot');
  const [tipoOperacao, setTipoOperacao] = useState<'compra' | 'venda' | ''>('compra');
  const [interval, setInterval] = useState("1d");

  const isQueryEnabled = !(marketType === 'futures' && selectedCrypto.endsWith('BRL'));

  const { data: initialChartData, isLoading: isChartDataLoading } = useQuery({
      queryKey: ["binanceKlines", marketType, interval, selectedCrypto],
      queryFn: async () => {
        const apiPath = marketType === "futures" ? "futures-klines" : "klines";
        const response = await fetch(`/api/binance/${apiPath}?symbol=${selectedCrypto}&interval=${interval}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Network response was not ok");
        }
        const data: BinanceKline[] = await response.json();
        return data.map(k => ({ time: (k[0] / 1000) as any, open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]) }));
      },
      enabled: isQueryEnabled,
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (initialChartData && initialChartData.length > 0) {
      const lastPrice = initialChartData[initialChartData.length - 1].close;
      const newLevels = {
        entry: lastPrice,
        takeProfit: lastPrice * 1.02,
        stopLoss: lastPrice * 0.98,
      };
      setTradeLevels(newLevels);
    }
  }, [initialChartData]);


  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [isIncomeDialogOpen, setIsIncomeDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | undefined>();

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

  const processedBudgetCategories = useMemo(() => {
    return fetchedBudgetCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      percentage: DEFAULT_ALLOCATION_PERCENTAGES[cat.name] || 0, // Apply default percentage
      amount: 0, // Initial amount, will be calculated later based on income
      actualSpending: 0,
    }));
  }, [fetchedBudgetCategories]);

  const [budgetCategories, setBudgetCategories] = useState<Category[]>([]); // Initialize as empty

  useEffect(() => {
    if (!isLoadingBudgetCategories && processedBudgetCategories.length > 0) {
      setBudgetCategories(processedBudgetCategories);
    }
  }, [processedBudgetCategories, isLoadingBudgetCategories]); // Depend on loading state too

  const isBudgetLoading = isLoadingBudgetCategories;


  const totalPercentage = useMemo(() => {
    return budgetCategories.reduce((sum, category) => sum + (Number(category.percentage) || 0), 0);
  }, [budgetCategories]);

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

  const totalIncome = useMemo(() => {
    return incomes.reduce((sum, i) => sum + i.amount, 0);
  }, [incomes]);

  const categoriesWithAmounts = useMemo(() => {
    return budgetCategories.map(category => ({
      ...category,
      amount: (totalIncome * (Number(category.percentage) || 0)) / 100,
    }));
  }, [totalIncome, budgetCategories]);

  const categoriesWithSpending = useMemo(() => {
    return categoriesWithAmounts.map(category => {
      const categoryExpenses = expenses.filter(expense => expense.categoria === category.name);
      const actualSpending = categoryExpenses.reduce((sum, expense) => sum + expense.valor, 0);
      return {
        ...category,
        actualSpending,
      };
    });
  }, [categoriesWithAmounts, expenses]);

  const summary = useMemo(() => {
    const pendentes = expenses.filter(e => e.status === 'Pendente');
    const pagos = expenses.filter(e => e.status === 'Pago');
    const totalExpenses = expenses.reduce((sum, e) => sum + e.valor, 0);
    const totalSavings = expenses.reduce((sum, e) => sum + (e.savedAmount || 0), 0);

    const totalBudgeted = categoriesWithAmounts.reduce((sum, c) => sum + c.amount, 0);
    
    // Find the specific budget for the "Despesas" category
    const despesasCategory = categoriesWithAmounts.find(c => c.name === "Despesas");
    const allocatedTotalExpenses = despesasCategory ? despesasCategory.amount : 0;
    
    const remainingTotalExpenses = allocatedTotalExpenses - totalExpenses;


    // New logic here
    const essentialCategory = categoriesWithSpending.find(c => c.name === 'Despesas Essenciais');
    const budgetedEssential = essentialCategory ? essentialCategory.amount : 0;
    const actualEssential = essentialCategory ? essentialCategory.actualSpending || 0 : 0;
    const essentialDifference = actualEssential - budgetedEssential;

    return {
      totalPendentes: pendentes.reduce((sum, e) => sum + e.valor, 0),
      totalPagos: pagos.reduce((sum, e) => sum + e.valor, 0),
      totalGeral: totalExpenses,
      countPendentes: pendentes.length,
      countPagos: pagos.length,
      totalIncome: totalIncome,
      balance: totalIncome - totalExpenses,
      totalSavings,
      budgetedEssential,
      actualEssential,
      essentialDifference,
      expenses,
      totalBudgeted,
      allocatedTotalExpenses,
      remainingTotalExpenses,
    };
  }, [expenses, totalIncome, categoriesWithSpending, categoriesWithAmounts]);

  const handleCategoryChange = (id: string, field: 'name' | 'percentage', value: string | number) => {
    setBudgetCategories(prevCategories => {
      const updatedCategories = prevCategories.map(category => {
        if (category.id === id) {
          return { ...category, [field]: value };
        }
        return category;
      });
      return updatedCategories;
    });
  };

  const handleAddCategory = () => {
    const newId = Date.now().toString();
    const newCategory: Category = { id: newId, name: 'Nova Categoria', percentage: 0, amount: 0, actualSpending: 0 };
    setBudgetCategories(prev => [...prev, newCategory]);
  };

  const handleRemoveCategory = (id: string) => {
    setBudgetCategories(prev => prev.filter(category => category.id !== id));
  };

  

  const addIncomeMutation = useMutation({
    mutationFn: addIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes', year, month] });

      setIsIncomeDialogOpen(false);
    },
  });

  const updateIncomeMutation = useMutation({
    mutationFn: updateIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes', year, month] });

      setIsIncomeDialogOpen(false);
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: deleteIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes', year, month] });

      toast.success('Renda deletada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao deletar renda.');
    }
  });

  const addExpenseMutation = useMutation({
    mutationFn: addExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', year, month] });

      setIsExpenseDialogOpen(false);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: updateExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', year, month] });

      setIsExpenseDialogOpen(false);
    },
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
    localStorage.setItem('tradeLevels', JSON.stringify(tradeLevels));
  }, [tradeLevels]);

  useEffect(() => {
    const entry = tradeLevels.entry;
    if (!entry) return;

    // Apenas troca se a ordem estiver incorreta para o tipo de operação atual
    if (tipoOperacao === 'venda' && tradeLevels.takeProfit > entry && tradeLevels.stopLoss < entry) {
        setTradeLevels(currentLevels => ({
            ...currentLevels,
            takeProfit: currentLevels.stopLoss,
            stopLoss: currentLevels.takeProfit
        }));
    } else if (tipoOperacao === 'compra' && tradeLevels.takeProfit < entry && tradeLevels.stopLoss > entry) {
        setTradeLevels(currentLevels => ({
            ...currentLevels,
            takeProfit: currentLevels.stopLoss,
            stopLoss: currentLevels.takeProfit
        }));
    }
  }, [tipoOperacao, tradeLevels.entry, tradeLevels.stopLoss, tradeLevels.takeProfit]);

  const handleMarketTypeChange = (newMarketType: 'spot' | 'futures') => {
    setMarketType(newMarketType);
    if (newMarketType === 'futures' && selectedCrypto.endsWith('BRL')) {
      const newSymbol = selectedCrypto.replace('BRL', 'USDT');
      toast(`Símbolo alterado para ${newSymbol} para ser compatível com o mercado de Futuros.`);
      setSelectedCrypto(newSymbol);
    }
  };

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

  const handleDeleteIncome = (id: string) => {
    deleteIncomeMutation.mutate(id);
  };

  const handleSaveItem = (item: Omit<Expense, "id"> | Omit<Income, "id">, type: "expense" | "income") => {
    console.log("DashboardPage: Recebido para salvar.", { item, type });

    if (type === 'income') {
      const payload = { ...item as Omit<Income, "id"> };
      payload.date = new Date(payload.date || selectedDate);
      console.log("DashboardPage: Enviando payload de Renda para mutation.", payload);

      if (editingIncome) {
        updateIncomeMutation.mutate({ ...payload, id: editingIncome.id });
      } else {
        addIncomeMutation.mutate(payload);
      }
    } else if (type === 'expense') {
      const payload = { ...item as Omit<Expense, "id"> };
      payload.dataVencimento = new Date(payload.dataVencimento || selectedDate);
      console.log("DashboardPage: Enviando payload de Despesa para mutation.", payload);
      
      if (editingExpense) {
        updateExpenseMutation.mutate({ ...payload, id: editingExpense.id });
      } else {
        addExpenseMutation.mutate(payload);
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
            <MonthSelector initialDate={selectedDate} onChange={setSelectedDate} />
            <PersonalFinanceNav activeTab={activeFinanceTab} incomes={incomes} expenses={expenses} />
            {activeFinanceTab === 'orcamento' ? (
              <OrcamentoPage 
                income={summary.totalIncome}
                categories={categoriesWithSpending}
                onCategoryChange={handleCategoryChange}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
                onRestore={() => { /* Lógica de restauração pode ser implementada aqui se necessário */ }}
                isLoading={isBudgetLoading}
                totalPercentage={totalPercentage}
              />
            ) : (
              <>
                <Sidebar />
                <div className={styles.personalFinanceContainer}>
                  <IncomeTable
                    incomes={incomes}
                    isLoading={isLoadingIncomes}
                    onAddIncome={handleAddIncome}
                    onEditIncome={handleEditIncome}
                    onDeleteIncome={handleDeleteIncome}
                  />
                  <PersonalFinanceTable
                    onAddExpense={handleAddExpense}
                    onEditExpense={handleEditExpense}
                    summary={summary}
                    expenses={expenses}
                    isLoading={isLoadingExpenses}
                    isError={isErrorExpenses}
                    budgetCategories={categoriesWithSpending}
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
        return (
          <>
            <TechnicalAnalysisChart
              initialChartData={initialChartData}
              isLoading={isChartDataLoading}
              interval={interval}
              onIntervalChange={setInterval}
              tradeLevels={tradeLevels}
              onLevelsChange={setTradeLevels}
              selectedCrypto={selectedCrypto}
              onCryptoSelect={handleCryptoSelect}
              marketType={marketType}
              onMarketTypeChange={handleMarketTypeChange}
              tipoOperacao={tipoOperacao}
            >
              <TradeJournal 
                tradeLevels={tradeLevels} 
                onLevelsChange={setTradeLevels}
                selectedCrypto={selectedCrypto}
                tipoOperacao={tipoOperacao}
                onTipoOperacaoChange={setTipoOperacao}
                marketType={marketType}
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