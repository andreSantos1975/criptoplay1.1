"use client";

import { useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

// Interface for a Trade
interface Trade {
  id: string;
  symbol: string;
  type: string;
  status: 'OPEN' | 'CLOSED';
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
}

// Interface for CapitalMovement
interface CapitalMovement {
  id: string;
  userId: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  date: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Function to fetch trades
const fetchTrades = async (): Promise<Trade[]> => {
  const response = await fetch("/api/trades");
  if (!response.ok) {
    throw new Error("Falha ao buscar as operações.");
  }
  const data = await response.json();
  return data.map((trade: any) => ({
    ...trade,
    entryPrice: parseFloat(trade.entryPrice) || 0,
    exitPrice: trade.exitPrice != null ? parseFloat(trade.exitPrice) : null,
    quantity: parseFloat(trade.quantity) || 0,
    pnl: trade.pnl != null ? parseFloat(trade.pnl) : null,
  }));
};

// Function to fetch capital movements
const fetchCapitalMovements = async (): Promise<CapitalMovement[]> => {
  const response = await fetch("/api/capital-movements");
  if (!response.ok) {
    throw new Error("Falha ao buscar movimentos de capital.");
  }
  const data = await response.json();
  return data.map((movement: any) => ({
    ...movement,
    amount: parseFloat(movement.amount) || 0,
  }));
};

// Helper to format currency
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "N/A";
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  };
  return new Intl.NumberFormat("pt-BR", options).format(value);
};

// Function to generate portfolio data
const generatePortfolioData = (
  trades: Trade[],
  capitalMovements: CapitalMovement[],
  granularity: 'weekly' | 'monthly',
  defaultInitialCapital: number = 0
) => {
  console.log(`--- generatePortfolioData START (Granularity: ${granularity}) ---`);

  let calculatedInitialCapital = defaultInitialCapital;
  capitalMovements.forEach(movement => {
    if (movement.type === 'DEPOSIT') {
      calculatedInitialCapital += Number(movement.amount);
    } else if (movement.type === 'WITHDRAWAL') {
      calculatedInitialCapital -= Number(movement.amount);
    }
  });

  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl != null && t.exitDate != null);

  if (closedTrades.length === 0) {
    console.log("No closed trades, returning default data based on capital.");
    const defaultData = [
      { date: "Início", portfolio: calculatedInitialCapital },
    ];
    return defaultData;
  }

  const chartData: { date: string; portfolio: number }[] = [];
  let currentPortfolioValue = calculatedInitialCapital;

  if (granularity === 'monthly') {
    const monthlyPnl: { [key: string]: number } = {};
    closedTrades.forEach(trade => {
      const exitDate = new Date(trade.exitDate!);
      if (isNaN(exitDate.getTime())) return;
      const yearMonth = `${exitDate.getFullYear()}-${(exitDate.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyPnl[yearMonth] = (monthlyPnl[yearMonth] || 0) + Number(trade.pnl || 0);
    });

    const sortedMonths = Object.keys(monthlyPnl).sort();
    sortedMonths.forEach(yearMonth => {
      currentPortfolioValue += monthlyPnl[yearMonth];
      const [year, month] = yearMonth.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('pt-BR', { month: 'short' });
      chartData.push({ date: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, portfolio: currentPortfolioValue });
    });

  } else { // weekly
    const weeklyPnl: { [key: string]: number } = {};
    const getMonday = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    };

    closedTrades.forEach(trade => {
      const exitDate = new Date(trade.exitDate!);
      if (isNaN(exitDate.getTime())) return;
      const monday = getMonday(exitDate);
      const weekKey = monday.toISOString().split('T')[0];
      weeklyPnl[weekKey] = (weeklyPnl[weekKey] || 0) + Number(trade.pnl || 0);
    });

    const sortedWeeks = Object.keys(weeklyPnl).sort();
    sortedWeeks.forEach(weekKey => {
      currentPortfolioValue += weeklyPnl[weekKey];
      const date = new Date(weekKey);
      const monthName = date.toLocaleString('pt-BR', { month: 'short' });
      const day = date.getDate();
      const label = `${day} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
      chartData.push({ date: label, portfolio: currentPortfolioValue });
    });
  }

  console.log("Final Chart Data:", chartData);
  console.log("--- generatePortfolioData END ---");

  if (chartData.length === 0) {
    return [{ date: "Início", portfolio: calculatedInitialCapital }];
  }

  return chartData;
};


export const DashboardOverview = () => {
  const [chartGranularity, setChartGranularity] = useState<'weekly' | 'monthly'>('monthly');

  const { data: trades, isLoading: isLoadingTrades, error: errorTrades } = useQuery<Trade[]>({
    queryKey: ['trades'],
    queryFn: fetchTrades,
  });

  const { data: capitalMovements, isLoading: isLoadingCapital, error: errorCapital } = useQuery<CapitalMovement[]>({
    queryKey: ['capitalMovements'],
    queryFn: fetchCapitalMovements,
  });

  const isLoading = isLoadingTrades || isLoadingCapital;
  const error = errorTrades || errorCapital;

  const portfolioData = generatePortfolioData(trades || [], capitalMovements || [], chartGranularity);

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
        <CardContent><div className={styles.chartContainer} style={{ color: 'red' }}>Erro ao carregar dados do portfólio: {error.message}</div></CardContent>
      </Card>
    );
  }

  return (
    <div className={styles.overviewContainer}>
      <Card>
        <CardHeader className={styles.cardHeader}>
          <CardTitle>Evolução do Portfólio</CardTitle>
          <div className={styles.toggleButtons}>
            <Button
              variant={chartGranularity === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartGranularity('weekly')}
              className={styles.toggleButton}
            >
              Semanal
            </Button>
            <Button
              variant={chartGranularity === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartGranularity('monthly')}
              className={styles.toggleButton}
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
                    <stop offset="5%" stopColor="hsl(var(--chart-green))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-green))" stopOpacity={0} />
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
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Portfólio",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="portfolio"
                  stroke="hsl(var(--chart-green))"
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
