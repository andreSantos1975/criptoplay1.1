export interface Expense {
  id: string;
  categoria: string;
  valor: number;
  dataVencimento: Date;
  status: "Pendente" | "Pago";
}

export interface ExpenseSummary {
  totalPendentes: number;
  totalPagos: number;
  totalGeral: number;
  countPendentes: number;
  countPagos: number;
  totalIncome: number;
  balance: number;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: Date;
}
