"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartDataItem {
  month: string;
  Receita: number;
  Despesa: number;
}

interface IncomeVsExpenseChartProps {
  data: ChartDataItem[];
}

export function IncomeVsExpenseChart({ data }: IncomeVsExpenseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        Nenhum dado para exibir.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis
          tickFormatter={(value) =>
            new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
              notation: "compact",
            }).format(value)
          }
        />
        <Tooltip
          formatter={(value: number | undefined) => [
            new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(value ?? 0),
            "",
          ]}
        />
        <Legend />
        <Bar dataKey="Receita" fill="#10b981" />
        <Bar dataKey="Despesa" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  );
}