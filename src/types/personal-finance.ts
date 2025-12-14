export interface Expense {
  id: string;
  categoria: string;
  valor: number;
  dataVencimento: Date;
  status: "Pendente" | "Pago";
  originalValor?: number; // Campo para armazenar o valor original da despesa
  savedAmount?: number; // Campo para armazenar a economia calculada para esta despesa
  applySavingsCalculation?: boolean;
}

export interface ExpenseSummary {
  totalPendentes: number;
  totalPagos: number;
  totalGeral: number;
  countPendentes: number;
  countPagos: number;
  totalIncome: number;
  balance: number;
  totalSavings: number;
  budgetedEssential: number;
  actualEssential: number;
  essentialDifference: number;
  expenses: Expense[];
  totalBudgeted: number;
  allocatedTotalExpenses: number;
  remainingTotalExpenses: number;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: Date;
}

export interface Category {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  actualSpending?: number;
}
