"use client";

import { useState, useMemo } from "react";
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
  const response = await fetch("/api/simulator/trades");
  if (!response.ok) {
    throw new Error("Falha ao buscar as operações.");
  }
  return response.json();
};

// Function to fetch capital movements
const fetchCapitalMovements = async (): Promise<CapitalMovement[]> => {
  const response = await fetch("/api/capital-movements");
  if (!response.ok) {
    throw new Error("Falha ao buscar movimentos de capital.");
  }
  return response.json();
};

// Helper to format currency
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "N/A";
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2, // Corrected for BRL
  };
  return new Intl.NumberFormat("pt-BR", options).format(value);
};

// Function to generate portfolio data
const generatePortfolioData = (
  trades: Trade[],
  capitalMovements: CapitalMovement[],
  granularity: 'weekly' | 'monthly',
  usdtToBrlRate: number, // New parameter for exchange rate
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
      
      // Convert PnL from USDT to BRL
      const pnlInBRL = Number(trade.pnl) * usdtToBrlRate;
      monthlyPnl[yearMonth] = (monthlyPnl[yearMonth] || 0) + pnlInBRL;
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

      // Convert PnL from USDT to BRL
      const pnlInBRL = Number(trade.pnl) * usdtToBrlRate;
      weeklyPnl[weekKey] = (weeklyPnl[weekKey] || 0) + pnlInBRL;
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

  // Fetch USDT to BRL exchange rate
  const { data: usdtToBrlData, isLoading: isLoadingUsdtToBrl, error: errorUsdtToBrl } = useQuery({
    queryKey: ['usdtToBrlRate'],
    queryFn: async () => {
      const response = await fetch('/api/exchange-rate');
      if (!response.ok) {
        throw new Error('Failed to fetch USDT to BRL rate');
      }
      const data = await response.json();
      return data.usdtToBrl;
    },
    staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Data stays in cache for 10 minutes
    refetchOnWindowFocus: false, // Do not refetch on window focus
  });

  const isLoading = isLoadingTrades || isLoadingCapital || isLoadingUsdtToBrl;
  const error = errorTrades || errorCapital || errorUsdtToBrl;

  // Default to 1 if rate is not available to prevent division by zero or NaN issues
  const usdtToBrlRate = usdtToBrlData || 1;

  const portfolioData = useMemo(() => {
    if (trades && capitalMovements) {
      return generatePortfolioData(trades, capitalMovements, chartGranularity, usdtToBrlRate);
    }
    return [];
  }, [trades, capitalMovements, chartGranularity, usdtToBrlRate]);

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

  const lastPortfolioValue = portfolioData.length > 0 ? portfolioData[portfolioData.length - 1].portfolio : 0;
  const isNegative = lastPortfolioValue < 0;

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
