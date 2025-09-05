"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Income {
  id: string;
  amount: number;
  date: string;
}

interface Expense {
  id: string;
  valor: number;
  date: string;
}

const fetchIncomes = async (): Promise<Income[]> => {
  const res = await fetch("/api/incomes");
  if (!res.ok) throw new Error("Falha ao buscar rendas.");
  return res.json();
};

const fetchExpenses = async (): Promise<Expense[]> => {
  const res = await fetch("/api/expenses");
  if (!res.ok) throw new Error("Falha ao buscar despesas.");
  return res.json();
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const getMonthNumber = (month: string) => {
  const months: { [key: string]: number } = {
    jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
    jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11
  };
  return months[month.toLowerCase().replace('.', '')];
};

export const IncomeVsExpenseChart = () => {
  const { data: incomes = [], isLoading: isLoadingIncomes } = useQuery<Income[]>({
    queryKey: ["incomes"],
    queryFn: fetchIncomes
  });

  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: fetchExpenses
  });

  const chartData = useMemo(() => {
    const dataMap: { [key: string]: { Rendas: number; Despesas: number } } = {};

    incomes.forEach((income) => {
      const date = new Date(income.date);
      const month = date.toLocaleString("pt-BR", { month: "short", year: "2-digit" });
      if (!dataMap[month]) dataMap[month] = { Rendas: 0, Despesas: 0 };
      dataMap[month].Rendas += income.amount || 0;
    });

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const month = date.toLocaleString("pt-BR", { month: "short", year: "2-digit" });
      if (!dataMap[month]) dataMap[month] = { Rendas: 0, Despesas: 0 };
      dataMap[month].Despesas += expense.valor || 0;
    });

    return Object.entries(dataMap)
      .map(([month, values]) => ({
        month,
        ...values,
      }))
      .sort((a, b) => {
        const [aMonthStr, aYear] = a.month.split(" de ");
        const [bMonthStr, bYear] = b.month.split(" de ");
        const aDate = new Date(parseInt(aYear), getMonthNumber(aMonthStr));
        const bDate = new Date(parseInt(bYear), getMonthNumber(bMonthStr));
        return aDate.getTime() - bDate.getTime();
      });
  }, [incomes, expenses]);

  const isLoading = isLoadingIncomes || isLoadingExpenses;

  if (isLoading) return <p>Carregando gráfico...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução de Rendas vs. Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 30, right: 50, left: 50, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="Rendas" stroke="#82ca9d" />
              <Line type="monotone" dataKey="Despesas" stroke="#ff8042" />
            </LineChart>

          </ResponsiveContainer>
        ) : (
          <div>Dados insuficientes para gerar o gráfico.</div>
        )}
      </CardContent>
    </Card>
  );
};
