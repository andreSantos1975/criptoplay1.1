"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./DashboardOverview.module.css";
import { Button } from "@/components/ui/button";
import { EmailVerificationAlert } from "@/components/dashboard/EmailVerificationAlert";

interface PortfolioData {
  date: string;
  "Patrimônio Líquido": number;
}

const fetchPortfolioEvolution = async (granularity: 'weekly' | 'monthly'): Promise<PortfolioData[]> => {
  const res = await fetch(`/api/reports/net-worth?granularity=${granularity}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Falha ao buscar evolução do portfólio.");
  }
  return res.json();
};


const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const DashboardOverview = () => {
  const [chartGranularity, setChartGranularity] = useState<'weekly' | 'monthly'>('monthly');

  const { data: portfolioData = [], isLoading, error } = useQuery<PortfolioData[], Error>({
    queryKey: ["portfolioEvolution", chartGranularity],
    queryFn: () => fetchPortfolioEvolution(chartGranularity),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Evolução do Portfólio</CardTitle></CardHeader>
        <CardContent><div className={styles.chartContainer}>Carregando dados do portfólio...</div></CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Evolução do Portfólio</CardTitle></CardHeader>
        <CardContent><div className={styles.chartContainer} style={{ color: 'red' }}>Erro ao carregar dados: {error.message}</div></CardContent>
      </Card>
    );
  }

  const lastPortfolioValue = portfolioData.length > 0 ? portfolioData[portfolioData.length - 1]["Patrimônio Líquido"] : 0;
  const isNegative = lastPortfolioValue < 0;

  return (
    <div className={styles.overviewContainer}>
      <EmailVerificationAlert />
      <Card>
        <CardHeader className={styles.cardHeader}>
          <CardTitle>Evolução do Portfólio</CardTitle>
          <div className={styles.toggleButtons}>
            <Button
              variant={chartGranularity === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartGranularity('weekly')}
            >
              Semanal
            </Button>
            <Button
              variant={chartGranularity === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartGranularity('monthly')}
            >
              Mensal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioData}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isNegative ? "hsl(var(--chart-red))" : "hsl(var(--chart-green))"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isNegative ? "hsl(var(--chart-red))" : "hsl(var(--chart-green))"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: number | undefined) => [
                    formatCurrency(value),
                    "Portfólio",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="Patrimônio Líquido"
                  stroke={isNegative ? "hsl(var(--chart-red))" : "hsl(var(--chart-green))"}
                  fillOpacity={1}
                  fill="url(#portfolioGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};