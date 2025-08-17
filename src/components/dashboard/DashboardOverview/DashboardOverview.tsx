"use client";

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
  pnl?: number; // Now guaranteed to be a number after fetchTrades
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
  // Map over the data to convert Decimal objects (from Prisma) to numbers
  return data.map((trade: any) => {
    console.log("Raw trade.pnl from API:", trade.pnl, "Type:", typeof trade.pnl);
    return {
      ...trade,
      entryPrice: parseFloat(trade.entryPrice) || 0, // Robust parsing
      exitPrice: trade.exitPrice != null ? (parseFloat(trade.exitPrice) || 0) : null,
      quantity: parseFloat(trade.quantity) || 0,
      pnl: trade.pnl != null ? (parseFloat(trade.pnl) || 0) : null,
    };
  });
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
    amount: parseFloat(movement.amount) || 0, // Robust parsing
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

// Function to generate portfolio data from trades and capital movements
const generatePortfolioData = (
  trades: Trade[],
  capitalMovements: CapitalMovement[],
  defaultInitialCapital: number = 0 // Default to 0 if no movements
) => {
  console.log("--- generatePortfolioData START ---");
  console.log("Input Trades:", trades);
  console.log("Input Capital Movements:", capitalMovements);

  // Calculate the net initial capital from movements
  let calculatedInitialCapital = defaultInitialCapital;
  capitalMovements.forEach(movement => {
    if (movement.type === 'DEPOSIT') {
      calculatedInitialCapital += Number(movement.amount); // Ensure it's a number
    } else if (movement.type === 'WITHDRAWAL') {
      calculatedInitialCapital -= Number(movement.amount); // Ensure it's a number
    } 
  });
  console.log("Calculated Initial Capital:", calculatedInitialCapital);

  // If no trades, return data based on calculatedInitialCapital
  if (!trades || trades.length === 0) {
    console.log("No trades, returning default data.");
    console.log("--- generatePortfolioData END ---");
    return [
      { date: "Jan", portfolio: calculatedInitialCapital },
      { date: "Fev", portfolio: calculatedInitialCapital },
      { date: "Mar", portfolio: calculatedInitialCapital },
      { date: "Abr", portfolio: calculatedInitialCapital },
      { date: "Mai", portfolio: calculatedInitialCapital },
      { date: "Jun", portfolio: calculatedInitialCapital },
    ];
  }

  const monthlyPnl: { [key: string]: number } = {};

  // Filter for closed trades with PnL and aggregate by month
  trades.filter(t => t.status === 'CLOSED' && t.pnl != null && t.exitDate != null).forEach(trade => { 
    const exitDate = new Date(trade.exitDate!); 
    if (isNaN(exitDate.getTime())) { 
      console.warn("Invalid exitDate for trade, skipping:", trade);
      return; 
    }
    const yearMonth = `${exitDate.getFullYear()}-${(exitDate.getMonth() + 1).toString().padStart(2, '0')}`;
    monthlyPnl[yearMonth] = Number(monthlyPnl[yearMonth] || 0) + Number(trade.pnl || 0); // Explicitly convert to number
  });
  console.log("Monthly PnL:", monthlyPnl);

  const sortedMonths = Object.keys(monthlyPnl).sort();
  const chartData = [];
  let currentPortfolioValue = calculatedInitialCapital; // Start from calculated capital

  // Generate cumulative portfolio data
  sortedMonths.forEach(yearMonth => {
    currentPortfolioValue += monthlyPnl[yearMonth];
    const [year, month] = yearMonth.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('pt-BR', { month: 'short' });
    chartData.push({ date: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, portfolio: currentPortfolioValue });
  });
  console.log("Final Chart Data:", chartData);
  console.log("--- generatePortfolioData END ---");

  // If chartData is empty after processing trades, return initial data
  if (chartData.length === 0) {
    console.log("Chart data empty after processing, returning default.");
    return [
      { date: "Jan", portfolio: calculatedInitialCapital },
      { date: "Fev", portfolio: calculatedInitialCapital },
      { date: "Mar", portfolio: calculatedInitialCapital },
      { date: "Abr", portfolio: calculatedInitialCapital },
      { date: "Mai", portfolio: calculatedInitialCapital },
      { date: "Jun", portfolio: calculatedInitialCapital },
    ];
  }

  return chartData;
};


export const DashboardOverview = () => {
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

  const portfolioData = generatePortfolioData(trades || [], capitalMovements || []); 

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
      {/* Portfolio Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Portfólio</CardTitle>
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
                  tickFormatter={(value) => formatCurrency(value)} // Use formatCurrency for Y-axis
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [
                    formatCurrency(value), // Use formatCurrency for Tooltip
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