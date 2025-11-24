export interface Expense {
  id: string;
  categoria: string;
  valor: number;
  dataVencimento: Date;
  status: "Pendente" | "Pago";
  originalValor?: number; // Campo para armazenar o valor original da despesa
  savedAmount?: number; // Campo para armazenar a economia calculada para esta despesa
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
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: Date;
}
