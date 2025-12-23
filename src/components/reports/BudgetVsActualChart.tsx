"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Expense {
  id: string;
  categoria: string;
  valor: number;
  date: string;
}

interface Category {
  name: string;
  percentage: number;
}

interface BudgetData {
  income: number;
  categories: Category[];
  month: number;
  year: number;
}

const fetchExpenses = async (): Promise<Expense[]> => {
  const res = await fetch("/api/expenses");
  if (!res.ok) throw new Error("Falha ao buscar despesas.");
  return res.json();
};

const fetchBudget = async (): Promise<BudgetData> => {
  const res = await fetch("/api/budget"); // Fetches the most recent budget
  if (!res.ok) throw new Error("Falha ao buscar orçamento.");
  return res.json();
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export const BudgetVsActualChart = () => {
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery<Expense[]>({ 
    queryKey: ["expenses"], 
    queryFn: fetchExpenses 
  });

  const { data: budget, isLoading: isLoadingBudget } = useQuery<BudgetData>({ 
    queryKey: ["budget"], 
    queryFn: fetchBudget 
  });
  
  const chartData = useMemo(() => {
    if (!budget || !budget.categories || !expenses) return [];

    const actualExpenses: { [key: string]: number } = {};
    expenses.forEach((expense) => {
      // Filter expenses for the budget month and year
      const expenseDate = new Date(expense.date);
      if (expenseDate.getMonth() + 1 === budget.month && expenseDate.getFullYear() === budget.year) {
        const category = expense.categoria || "Sem Categoria";
        actualExpenses[category] = (actualExpenses[category] || 0) + expense.valor;
      }
    });

    return budget.categories
      .filter(c => c.name !== 'Investimentos' && c.name !== 'Reserva Financeira')
      .map((category) => {
        const budgetedAmount = (budget.income * category.percentage) / 100;
        const actualAmount = actualExpenses[category.name] || 0;
        return {
          name: category.name,
          Orçado: budgetedAmount,
          Realizado: actualAmount,
        };
      });
  }, [budget, expenses]);

  const isLoading = isLoadingExpenses || isLoadingBudget;

  if (isLoading) return <p>Carregando gráfico...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orçamento vs. Realizado</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={chartData}
              margin={{ top: 20, right: 30, left: 30, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(v: number | undefined) => formatCurrency(v ?? 0)} />
              <Legend />
              <Bar dataKey="Orçado" fill="#8884d8" />
              <Bar dataKey="Realizado" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div>Dados insuficientes para gerar o gráfico.</div>
        )}
      </CardContent>
    </Card>
  );
};
