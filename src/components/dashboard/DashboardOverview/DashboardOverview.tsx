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
import { Button } from "@/components/ui/button";
import { useDashboardOverview } from "@/hooks/useDashboard";
import type { Decimal } from "@prisma/client/runtime/library";

// These interfaces are for type-checking the data that comes from the API
interface Trade {
  id: string;
  symbol: string;
  type: string;
  status: 'OPEN' | 'CLOSED';
  entryDate: string;
  exitDate?: string;
  entryPrice: Decimal;
  exitPrice?: Decimal;
  quantity: Decimal;
  pnl?: Decimal;
}

interface CapitalMovement {
  id: string;
  userId: string;
  amount: Decimal;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  date: string;
}

// Helper to format currency remains the same
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// REWRITTEN LOGIC for generating portfolio data
const generatePortfolioData = (
  trades: Trade[],
  capitalMovements: CapitalMovement[],
  granularity: 'weekly' | 'monthly',
  usdtToBrlRate: number
) => {
  const BASE_BALANCE = 10000; // The true initial balance of the simulator

  const events: { date: Date; amount: number }[] = [];

  capitalMovements.forEach(movement => {
    events.push({
      date: new Date(movement.date),
      amount: Number(movement.amount) * (movement.type === 'DEPOSIT' ? 1 : -1)
    });
  });

  const closedTrades = trades.filter(t => t.status === 'CLOSED' && t.pnl != null && t.exitDate);
  closedTrades.forEach(trade => {
    events.push({
      date: new Date(trade.exitDate!),
      amount: Number(trade.pnl) * usdtToBrlRate
    });
  });

  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  const aggregatedEvents: { [key: string]: number } = {};

  if (granularity === 'monthly') {
    events.forEach(event => {
      const yearMonth = `${event.date.getFullYear()}-${(event.date.getMonth() + 1).toString().padStart(2, '0')}`;
      aggregatedEvents[yearMonth] = (aggregatedEvents[yearMonth] || 0) + event.amount;
    });
  } else { // weekly
    const getMonday = (d: Date) => {
      const date = new Date(d);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    };
    events.forEach(event => {
      const monday = getMonday(event.date);
      const weekKey = monday.toISOString().split('T')[0];
      aggregatedEvents[weekKey] = (aggregatedEvents[weekKey] || 0) + event.amount;
    });
  }
  
  const chartData: { date: string; portfolio: number }[] = [];
  let currentPortfolioValue = BASE_BALANCE;
  chartData.push({ date: "Início", portfolio: currentPortfolioValue });

  const sortedKeys = Object.keys(aggregatedEvents).sort();

  sortedKeys.forEach(key => {
    currentPortfolioValue += aggregatedEvents[key];
    let label = key;
    if (granularity === 'monthly') {
      const [year, month] = key.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('pt-BR', { month: 'short' });
      label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
    } else {
      const date = new Date(key);
      const monthName = date.toLocaleString('pt-BR', { month: 'short' });
      const day = date.getDate();
      label = `${day} ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
    }
    chartData.push({ date: label, portfolio: currentPortfolioValue });
  });

  return chartData;
};

export const DashboardOverview = () => {
  const [chartGranularity, setChartGranularity] = useState<'weekly' | 'monthly'>('monthly');
  const { data, isLoading, error } = useDashboardOverview();

  const trades = data?.trades || [];
  const capitalMovements = data?.capitalMovements || [];
  const usdtToBrlRate = data?.usdtToBrlRate || 1;

  const portfolioData = useMemo(() => {
    if (data) {
      return generatePortfolioData(trades, capitalMovements, chartGranularity, usdtToBrlRate);
    }
    return [];
  }, [data, trades, capitalMovements, chartGranularity, usdtToBrlRate]);

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