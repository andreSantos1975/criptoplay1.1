"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: unknown;
}

interface BudgetExpenseChartProps {
  data: ChartDataItem[];
}

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", 
  "#FF4560", "#775DD0", "#546E7A", "#26a69a", "#D10CE8"
];

export function BudgetExpenseChart({ data }: BudgetExpenseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        Nenhum dado de despesa para exibir.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={(entry) => `${((entry.percent || 0) * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | undefined) => [
            `R$ ${(value ?? 0).toFixed(2)}`,
            "Orçado",
          ]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
