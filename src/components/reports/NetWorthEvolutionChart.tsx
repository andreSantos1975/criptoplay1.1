"use client";

import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NetWorthData {
  date: string;
  "Patrimônio Líquido": number;
}

const fetchNetWorthEvolution = async (): Promise<NetWorthData[]> => {
  const res = await fetch("/api/reports/net-worth");
  if (!res.ok) throw new Error("Falha ao buscar evolução do patrimônio.");
  return res.json();
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
}

export const NetWorthEvolutionChart = () => {
  const { data: chartData = [], isLoading, error } = useQuery<NetWorthData[]>({
    queryKey: ["netWorthEvolution"],
    queryFn: fetchNetWorthEvolution,
  });

  if (isLoading) return <p>Carregando gráfico...</p>;
  if (error) return <p>Erro ao carregar dados.</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução do Patrimônio Líquido</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatMonth} />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Patrimônio"]}/>
              <Legend />
              <Line
                type="monotone"
                dataKey="Patrimônio Líquido"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div>Dados insuficientes para exibir o gráfico.</div>
        )}
      </CardContent>
    </Card>
  );
};
