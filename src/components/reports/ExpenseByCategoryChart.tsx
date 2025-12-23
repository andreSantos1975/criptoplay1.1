"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Expense {
  id: string;
  categoria: string;
  valor: number;
}

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

export const ExpenseByCategoryChart = () => {
  const { data: expenses = [], isLoading, error } = useQuery<Expense[]>({ 
    queryKey: ["expenses"], 
    queryFn: fetchExpenses 
  });

  const expenseByCategoryData = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    expenses.forEach((expense) => {
      const category = expense.categoria || "Sem Categoria";
      categoryMap[category] = (categoryMap[category] || 0) + expense.valor;
    });

    const colors = [
      "#8884d8", "#82ca9d", "#ffc658", "#ff8042",
      "#0088FE", "#00C49F", "#FFBB28", "#FF8042"
    ];

    return Object.entries(categoryMap).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
  }, [expenses]);

  if (isLoading) return <p>Carregando gráfico...</p>;
  if (error) return <p>Erro ao carregar dados.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {expenseByCategoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
              <Pie
                data={expenseByCategoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} - ${((percent ?? 0) * 100).toFixed(1)}%`
                }
              >
                {expenseByCategoryData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number | undefined) => [formatCurrency(v ?? 0), "Valor"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div>Nenhuma despesa encontrada.</div>
        )}
      </CardContent>
    </Card>
  );
};
