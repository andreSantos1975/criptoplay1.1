"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import styles from "./ReportsSection.module.css";

// Interfaces (copied from DashboardOverview for consistency)
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

// Function to fetch trades (copied from DashboardOverview)
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

// Function to fetch capital movements (copied from DashboardOverview)
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

// Helper to format currency (copied from DashboardOverview)
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

interface MonthlyReportData {
  month: string; // e.g., "Jan 2025", "Fev 2025"
  pnl: number;
  deposits: number;
  withdrawals: number;
  tradeCount: number;
}

const generateMonthlyReportData = (
  trades: Trade[],
  capitalMovements: CapitalMovement[]
): MonthlyReportData[] => {
  const monthlyDataMap: { [key: string]: { pnl: number; deposits: number; withdrawals: number; tradeCount: number } } = {};

  // Process trades
  trades.filter(t => t.status === 'CLOSED' && t.pnl != null && t.exitDate != null).forEach(trade => {
    const exitDate = new Date(trade.exitDate!);
    if (isNaN(exitDate.getTime())) return;
    const yearMonth = `${exitDate.getFullYear()}-${(exitDate.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!monthlyDataMap[yearMonth]) {
      monthlyDataMap[yearMonth] = { pnl: 0, deposits: 0, withdrawals: 0, tradeCount: 0 };
    }
    monthlyDataMap[yearMonth].pnl += Number(trade.pnl);
    monthlyDataMap[yearMonth].tradeCount += 1;
  });

  // Process capital movements
  capitalMovements.forEach(movement => {
    const date = new Date(movement.date);
    if (isNaN(date.getTime())) return;
    const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    if (!monthlyDataMap[yearMonth]) {
      monthlyDataMap[yearMonth] = { pnl: 0, deposits: 0, withdrawals: 0, tradeCount: 0 };
    }
    if (movement.type === 'DEPOSIT') {
      monthlyDataMap[yearMonth].deposits += Number(movement.amount);
    } else if (movement.type === 'WITHDRAWAL') {
      monthlyDataMap[yearMonth].withdrawals += Number(movement.amount);
    }
  });

  const sortedMonths = Object.keys(monthlyDataMap).sort();
  const reportData: MonthlyReportData[] = [];

  sortedMonths.forEach(yearMonth => {
    const [year, month] = yearMonth.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('pt-BR', { month: 'short' });
    reportData.push({
      month: `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`,
      pnl: monthlyDataMap[yearMonth].pnl,
      deposits: monthlyDataMap[yearMonth].deposits,
      withdrawals: monthlyDataMap[yearMonth].withdrawals,
      tradeCount: monthlyDataMap[yearMonth].tradeCount,
    });
  });

  return reportData;
};

export const ReportsSection = () => {
  const queryClient = useQueryClient();
  const [timeframe, setTimeframe] = useState("Mensal"); // This state is for the table below, not the main chart
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [description, setDescription] = useState<string>('');

  // Fetch real data for the report chart
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

  const monthlyReportData = useMemo(() => {
    if (trades && capitalMovements) {
      return generateMonthlyReportData(trades, capitalMovements);
    }
    return [];
  }, [trades, capitalMovements]);

  // --- Mock Data (for other charts/tables, keep for now as per original file) ---
  const dailyData = [
    { period: "10/08/2025", operacoes: 5, lucro: 850, prejuizo: 200, retorno: 1.5 },
    { period: "11/08/2025", operacoes: 7, lucro: 1200, prejuizo: 450, retorno: 2.1 },
  ];
  
  const weeklyData = [
    { period: "Semana 32", operacoes: 25, lucro: 3500, prejuizo: 1100, retorno: 5.2 },
    { period: "Semana 33", operacoes: 31, lucro: 4100, prejuizo: 800, retorno: 6.9 },
  ];
  
  const monthlyData = [
    { period: "Julho 2025", operacoes: 45, lucro: 4500, prejuizo: 1200, retorno: 7.5 },
    { period: "Agosto 2025", operacoes: 38, lucro: 3200, prejuizo: 900, retorno: 6.8 },
  ];
  
  const yearlyData = [
    { period: "2024", operacoes: 550, lucro: 45000, prejuizo: 15000, retorno: 30.0 },
    { period: "2025", operacoes: 480, lucro: 38000, prejuizo: 11000, retorno: 27.0 },
  ];
  
  const profitLossData = [
    { month: "Jan", profit: 2500, loss: -800 },
    { month: "Fev", profit: 3200, loss: -1200 },
    { month: "Mar", profit: 4100, loss: -900 },
    { month: "Abr", profit: 3800, loss: -1500 },
    { month: "Mai", profit: 4500, loss: -1100 },
    { month: "Jun", profit: 5200, loss: -800 },
  ];
  
  const cryptoDistribution = [
    { name: "Bitcoin", value: 45, color: "hsl(var(--primary))" },
    { name: "Ethereum", value: 30, color: "hsl(var(--chart-green))" },
    { name: "Altcoins", value: 25, color: "hsl(var(--accent))" },
  ];
  
  const investmentData = [
    { month: "Jan", investment: 5000, returns: 5800 },
    { month: "Fev", investment: 8000, returns: 9200 },
    { month: "Mar", investment: 12000, returns: 14100 },
    { month: "Abr", investment: 16000, returns: 18300 },
    { month: "Mai", investment: 20000, returns: 23400 },
    { month: "Jun", investment: 25000, returns: 29800 },
  ];
  // --- END Mock Data ---

  const { tableData, header } = useMemo(() => {
    switch (timeframe) {
      case "Diário":
        return { tableData: dailyData, header: "Dia" };
      case "Semanal":
        return { tableData: weeklyData, header: "Semana" };
      case "Anual":
        return { tableData: yearlyData, header: "Ano" };
      case "Mensal":
      default:
        return { tableData: monthlyData, header: "Mês" };
    }
  }, [timeframe]);

  const addCapitalMovementMutation = useMutation({
    mutationFn: async (newMovement: { amount: number; type: 'DEPOSIT' | 'WITHDRAWAL'; description?: string; date?: string }) => {
      const response = await fetch('/api/capital-movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMovement),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao registrar movimento de capital.');
      }
      return response.json();
    },
    onSuccess: () => {
      alert('Movimento de capital registrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['capitalMovements'] });
      setAmount(''); // Clear form
      setType('DEPOSIT');
      setDescription('');
    },
    onError: (error: Error) => {
      console.error('Erro ao registrar movimento:', error);
      alert(`Erro: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.')); // Handle comma as decimal
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('O valor deve ser um número positivo.');
      return;
    }
    addCapitalMovementMutation.mutate({
      amount: parsedAmount,
      type,
      description,
      date: new Date().toISOString(), // Record current date/time
    });
  };

  const timeframes = ["Diário", "Semanal", "Mensal", "Anual"]; // Re-added timeframes

  if (isLoading) {
    return (
      <div className={styles.reportsSection}>
        <Card>
          <CardHeader><CardTitle>Carregando Relatórios...</CardTitle></CardHeader>
          <CardContent>Carregando dados de trades e movimentos de capital...</CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.reportsSection}>
        <Card>
          <CardHeader><CardTitle>Erro ao Carregar Relatórios</CardTitle></CardHeader>
          <CardContent>Erro: {error.message}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.reportsSection}>
      {/* Formulário de Registro de Movimento de Capital */}
      <Card className={styles.formCard}>
        <CardHeader>
          <CardTitle>Registrar Movimento de Capital</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label htmlFor="amount">Valor (R$)</label>
              <input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className={styles.input}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="type">Tipo</label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as 'DEPOSIT' | 'WITHDRAWAL')}
                className={styles.select}
                required
              >
                <option value="DEPOSIT">Aporte</option>
                <option value="WITHDRAWAL">Retirada</option>
              </select>
            </div>
            <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
              <label htmlFor="description">Descrição (Opcional)</label>
              <textarea
                id="description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Aporte inicial, Retirada para despesas"
                className={styles.textarea}
              ></textarea>
            </div>
            <Button
              type="submit"
              disabled={addCapitalMovementMutation.isPending}
              className={styles.submitButton}
              style={{ gridColumn: 'span 2' }}
            >
              {addCapitalMovementMutation.isPending ? 'Registrando...' : 'Registrar Movimento'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Monthly Report Chart (P&L, Deposits, Withdrawals, Trade Count) */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório Mensal de Desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(value)} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value: number, name: string) => {
                  if (name === 'Trades') return [value, name];
                  return [formatCurrency(value), name];
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="pnl" fill="hsl(var(--chart-green))" name="Lucro/Prejuízo" />
                <Bar yAxisId="left" dataKey="deposits" fill="hsl(var(--primary))" name="Aportes" />
                <Bar yAxisId="left" dataKey="withdrawals" fill="hsl(var(--chart-red))" name="Retiradas" />
                <Bar yAxisId="right" dataKey="tradeCount" fill="hsl(var(--chart-blue))" name="Trades" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Other charts/tables (keep for now as per original file) */}
      <div className={styles.chartsGrid}>
        {/* Crypto Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição do Portfólio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cryptoDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {cryptoDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Investment vs Returns Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Investimento vs. Retorno</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={investmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="investment"
                    stroke="hsl(var(--primary))"
                    name="Investimento"
                  />
                  <Line
                    type="monotone"
                    dataKey="returns"
                    stroke="hsl(var(--chart-green))"
                    name="Retorno"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.timeframeSelector}>
            {timeframes.map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`${styles.timeframeButton} ${
                  timeframe === t ? styles.timeframeButtonActive : ""
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{header}</TableHead>
                <TableHead>Operações</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead>Prejuízo</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Retorno (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((item, index) => {
                const resultado = item.lucro - item.prejuizo;
                return (
                  <TableRow key={index}>
                    <TableCell>{item.period}</TableCell>
                    <TableCell>{item.operacoes}</TableCell>
                    <TableCell className={styles.positiveValue}>
                      R$ {item.lucro.toLocaleString()},00
                    </TableCell>
                    <TableCell className={styles.negativeValue}>
                      R$ {item.prejuizo.toLocaleString()},00
                    </TableCell>
                    <TableCell
                      className={
                        resultado >= 0
                          ? styles.positiveValue
                          : styles.negativeValue
                      }
                    >
                      R$ {resultado.toLocaleString()},00
                    </TableCell>
                    <TableCell className={styles.positiveValue}>
                      {item.retorno}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};