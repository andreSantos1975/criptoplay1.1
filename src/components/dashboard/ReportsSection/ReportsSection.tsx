"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Modal from "@/components/ui/modal/Modal";
import { TradingPerformanceSummary } from "@/components/reports/TradingPerformanceSummary";
import { Trade } from "@prisma/client";

// Interfaces
interface BinanceTicker {
  symbol: string;
  lastPrice: string;
}

// Data Fetching
const fetchTrades = async (): Promise<Trade[]> => {
  const res = await fetch("/api/simulator/trades");
  if (!res.ok) throw new Error("Falha ao buscar trades.");
  return res.json();
};

const fetchBinanceTickers = async (): Promise<BinanceTicker[]> => {
  const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  if (!res.ok) throw new Error("Falha ao buscar tickers da Binance.");
  return res.json();
};

// Helpers
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

// Data Processing
const generatePortfolioPerformanceData = (
  trades: Trade[],
  brlRate: number
) => {
  const events = [
    ...trades
      .filter((t) => t.status === "CLOSED" && t.pnl != null)
      .map((t) => {
        const pnlInBrl = t.symbol.includes('BRL')
          ? Number(t.pnl)
          : (Number(t.pnl) || 0) * brlRate;
        return {
          date: new Date(t.exitDate!),
          amount: pnlInBrl,
        };
      }),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (events.length === 0) return [{ date: "Início", Saldo: 0 }];

  let balance = 0;
  const performance = events.map((e) => {
    balance += e.amount;
    return {
      date: e.date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
      Saldo: balance,
    };
  });

  return [{ date: "Início", Saldo: 0 }, ...performance];
};

const generatePortfolioDistributionData = (
  openTrades: Trade[],
  tickers: BinanceTicker[],
  brlRate: number
) => {
  const portfolio: { [key: string]: number } = {};
  openTrades.forEach((trade) => {
    const ticker = tickers.find((t) => t.symbol === trade.symbol);
    if (ticker) {
      const value = ticker.symbol.includes('BRL')
        ? parseFloat(trade.quantity.toString()) * parseFloat(ticker.lastPrice)
        : parseFloat(trade.quantity.toString()) * parseFloat(ticker.lastPrice) * brlRate;
      const asset = trade.symbol.replace("USDT", "");
      portfolio[asset] = (portfolio[asset] || 0) + value;
    }
  });

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"];
  return Object.entries(portfolio).map(([name, value], i) => ({
    name,
    value,
    color: colors[i % colors.length],
  }));
};

const generateMonthlyReportData = (
  trades: Trade[],
  brlRate: number
) => {
  const monthlyMap: {
    [key: string]: {
      pnl: number;
      tradeCount: number;
    };
  } = {};

  trades
    .filter((t) => t.status === "CLOSED" && t.pnl != null)
    .forEach((trade) => {
      const date = new Date(trade.exitDate!);
      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      if (!monthlyMap[key])
        monthlyMap[key] = {
          pnl: 0,
          tradeCount: 0,
        };
      const pnlInBrl = trade.symbol.includes('BRL')
        ? Number(trade.pnl)
        : (Number(trade.pnl) || 0) * brlRate;
      monthlyMap[key].pnl += pnlInBrl;
      monthlyMap[key].tradeCount++;
    });

  return Object.entries(monthlyMap)
    .map(([key, value]) => ({
      month: new Date(key + "-02")
        .toLocaleString("pt-BR", { month: "short", year: "2-digit" })
        .replace(". de", "/"),
      ...value,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

interface SimulatorProfile {
  virtualBalance: number;
  openTrades: Trade[]; // Adicionei openTrades porque é usado em Simulator.tsx
}

const fetchSimulatorProfile = async (): Promise<SimulatorProfile> => {
  const response = await fetch('/api/simulator/profile');
  if (!response.ok) throw new Error('Falha ao buscar perfil do simulador.');
  const data = await response.json();
  // Ensure virtualBalance is a number, as Prisma Decimal can be serialized as string
  return { ...data, virtualBalance: Number(data.virtualBalance) };
};

export const ReportsSection = () => {

  const {
    data: trades = [],
    isLoading: l1,
    error: e1,
  } = useQuery<Trade[]>({ queryKey: ["trades"], queryFn: fetchTrades });
  const {
    data: exchangeRateData,
    isLoading: l3,
    error: e3,
  } = useQuery({
    queryKey: ["exchangeRate"],
    queryFn: async () =>
      (await fetch("/api/exchange-rate")).json(),
  });
  const {
    data: binanceTickers = [],
    isLoading: l4,
    error: e4,
  } = useQuery<BinanceTicker[]>({
    queryKey: ["binanceTickers"],
    queryFn: fetchBinanceTickers,
  });

  const {
    data: simulatorProfile,
    isLoading: l5,
    error: e5,
  } = useQuery<SimulatorProfile>({
    queryKey: ['simulatorProfile'],
    queryFn: fetchSimulatorProfile,
  });

  const isLoading = l1 || l3 || l4 || l5;
  const error = e1 || e3 || e4 || e5;

  const brlRate = exchangeRateData?.usdtToBrl || 1;
  const openTrades = useMemo(
    () => trades.filter((t) => t.status === "OPEN"),
    [trades]
  );

  const performanceData = useMemo(
    () => generatePortfolioPerformanceData(trades, brlRate),
    [trades, brlRate]
  );
  const distributionData = useMemo(() => {
    const rawData = generatePortfolioDistributionData(openTrades, binanceTickers, brlRate);

    const MIN_PERCENTAGE = 0.01; // 1% do total
    const total = rawData.reduce((acc, d) => acc + d.value, 0);

    let aggregated = 0;
    const filtered = rawData.filter(d => {
      const percent = d.value / total;
      if (percent < MIN_PERCENTAGE) {
        aggregated += d.value;
        return false;
      }
      return true;
    });

    if (aggregated > 0) {
      filtered.push({
        name: "Outros",
        value: aggregated,
        color: "#cccccc", // cinza padrão
      });
    }

    return filtered;
  }, [openTrades, binanceTickers, brlRate]);
  const monthlyReportData = useMemo(
    () => generateMonthlyReportData(trades, brlRate),
    [trades, brlRate]
  );

  const kpiData = useMemo(() => {
    const initialBalance = Number(simulatorProfile?.virtualBalance) || 0; 

    const totalPnl = trades
      .filter((t) => t.status === 'CLOSED' && t.pnl != null)
      .reduce((acc, t) => {
        const pnlInBrl = t.symbol.includes('BRL')
          ? Number(t.pnl)
          : Number(t.pnl) * brlRate;
        return acc + pnlInBrl;
      }, 0);

    const patrimonioAtual = initialBalance + totalPnl;

    return {
      patrimonioAtual,
      totalPnl,
    };
  }, [trades, brlRate, simulatorProfile?.virtualBalance]);

  if (isLoading)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando Relatórios...</CardTitle>
        </CardHeader>
      </Card>
    );
  if (error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
        </CardHeader>
        <CardContent>{(error as Error).message}</CardContent>
      </Card>
    );

  return (
    <div className={styles.reportsSection}>
      <div className={styles.headerContainer}>
        <h1 className={styles.mainTitle}>Relatórios</h1>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        <Card>
          <CardHeader>
            <CardTitle>Patrimônio Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.kpiValue}>{formatCurrency(kpiData.patrimonioAtual)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lucro/Prejuízo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`${styles.kpiValue} ${kpiData.totalPnl >= 0 ? styles.positive : styles.negative}`}>
              {formatCurrency(kpiData.totalPnl)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Avançada */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Performance Avançada</h2>
        <TradingPerformanceSummary trades={trades} />
      </div>

      {/* Gráficos */}
      <div className={styles.chartsGrid}>
        {/* Evolução do Patrimônio */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Patrimônio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData} margin={{ left: 80 }}>
                <CartesianGrid />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={formatCurrency} width={100} />
                <Tooltip
                  formatter={(v: number | undefined) => [formatCurrency(v ?? 0), "Saldo"]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  name="Saldo da Carteira"
                  stroke="#8884d8"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição da Carteira */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição da Carteira (Aberto)</CardTitle>
          </CardHeader>
          <CardContent>
            {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} - ${((percent ?? 0) * 100).toFixed(1)}%`
                    }
                  >
                    {distributionData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number | undefined) => [formatCurrency(v ?? 0), "Valor"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>Nenhuma posição aberta.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Relatório Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Relatório Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyReportData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" tickFormatter={formatCurrency} width={100} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: number | undefined, name: string | undefined) =>
                  name === "Trades" ? (value ?? 0) : formatCurrency(value ?? 0)
                }
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="pnl"
                name="Lucro/Prejuízo"
                fill="#82ca9d"
              />
              <Bar
                yAxisId="right"
                dataKey="tradeCount"
                name="Trades"
                fill="#ffc658"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  );
};
