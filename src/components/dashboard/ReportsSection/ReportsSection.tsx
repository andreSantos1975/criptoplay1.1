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
import { TradingPerformanceSummary, ProcessedTrade } from "@/components/reports/TradingPerformanceSummary"; // Import ProcessedTrade
import type { Trade } from "@/types/trade"; // Import Trade from local DTO

// Define ExtendedTrade to include margin for futures trades, if intended
// This type is used when casting 'trade' to access 'margin', which is typically on FuturesPosition
type ExtendedTrade = Trade & {
  margin?: string; // Prisma Decimal type is often represented as string in client
};

// Interfaces for props
interface CryptoData {
  symbol: string;
  price: string;
}

// Helpers
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

// Data Processing
const generatePortfolioPerformanceData = (
  trades: ProcessedTrade[], // Changed to ProcessedTrade
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
          date: t.exitDate!,
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
  openTrades: ProcessedTrade[], // Changed to ProcessedTrade
  tickers: CryptoData[],
  brlRate: number
) => {
  const portfolio: { [key: string]: number } = {};
  openTrades.forEach((trade) => {
    const ticker = tickers.find((t) => t.symbol === trade.symbol);
    if (ticker) {
      const value = ticker.symbol.includes('BRL')
        ? trade.quantity * parseFloat(ticker.price) // quantity is number
        : trade.quantity * parseFloat(ticker.price) * brlRate; // quantity is number
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
  trades: ProcessedTrade[], // Changed to ProcessedTrade
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
  openPositions: any[];
}

interface ReportsSectionProps {
  trades: Trade[]; // This still expects DTO Trade[]
  binanceTickers: CryptoData[];
  isLoadingTrades: boolean;
  isLoadingBinanceTickers: boolean;
  errorTrades: Error | null;
  simulatorProfile: SimulatorProfile | undefined;
  isLoadingSimulator: boolean;
  errorSimulator: Error | null;
}

export const ReportsSection = ({
  trades, // This is DTO Trade[]
  binanceTickers,
  isLoadingTrades,
  isLoadingBinanceTickers,
  errorTrades,
  simulatorProfile,
  isLoadingSimulator,
  errorSimulator,
}: ReportsSectionProps) => {

  const openTrades = useMemo(
    () => trades.filter((t) => t.status === "OPEN"),
    [trades]
  );
  
  const openSymbols = useMemo(() => {
      return Array.from(new Set(openTrades.map(t => t.symbol)));
  }, [openTrades]);

  const {
    data: exchangeRateData,
    isLoading: l3,
    error: e3,
  } = useQuery({
    queryKey: ["exchangeRate"],
    queryFn: async () =>
      (await fetch("/api/exchange-rate")).json(),
  });
  
  const isLoading = isLoadingTrades || l3 || isLoadingBinanceTickers || isLoadingSimulator;
  const error = errorTrades || e3 || errorSimulator;

  const brlRate = exchangeRateData?.usdtToBrl || 1;
  
  const tradesWithDates = useMemo(() => {
    return trades.map((trade: Trade) => ({ // Explicitly type 'trade' as 'Trade' from DTO
      ...trade,
      createdAt: new Date(trade.createdAt),
      entryDate: new Date(trade.entryDate),
      exitDate: trade.exitDate ? new Date(trade.exitDate) : null,
      updatedAt: new Date(trade.updatedAt),
      quantity: parseFloat(trade.quantity),
      entryPrice: parseFloat(trade.entryPrice),
      exitPrice: trade.exitPrice ? parseFloat(trade.exitPrice) : null,
      stopLoss: parseFloat(trade.stopLoss),
      takeProfit: parseFloat(trade.takeProfit),
      pnl: trade.pnl ? parseFloat(trade.pnl) : null,
      strategy: trade.strategy === undefined ? null : trade.strategy,
    })) as ProcessedTrade[]; // Cast the entire array to ProcessedTrade[]
  }, [trades]);

  const performanceData = useMemo(
    () => generatePortfolioPerformanceData(tradesWithDates, brlRate),
    [tradesWithDates, brlRate]
  );

  const distributionData = useMemo(
    () => {
      const processedOpenTrades = tradesWithDates.filter(t => t.status === "OPEN");
      return generatePortfolioDistributionData(processedOpenTrades, binanceTickers, brlRate);
    },
    [tradesWithDates, binanceTickers, brlRate]
  );

  const monthlyReportData = useMemo(
    () => generateMonthlyReportData(tradesWithDates, brlRate),
    [tradesWithDates, brlRate]
  );

  const kpiData = useMemo(() => {
    const totalPnl = tradesWithDates
      .filter((t) => t.status === "CLOSED" && t.pnl != null)
      .reduce((acc, t) => {
        const pnlInBrl = t.symbol.includes('BRL')
          ? Number(t.pnl)
          : (Number(t.pnl) || 0) * brlRate;
        return acc + pnlInBrl;
      }, 0);

    const unrealizedEquity = tradesWithDates
      .filter((t) => t.status === "OPEN")
      .reduce((acc, trade) => {
        const ticker = binanceTickers.find((t) => t.symbol === trade.symbol);
        if (ticker) {
          const currentPrice = parseFloat(ticker.price);
          
          // Calculate PnL: (Current Price - Entry Price) * Quantity for BUY/LONG
          // (Entry Price - Current Price) * Quantity for SELL/SHORT
          let pnl = 0;
          if (trade.type === 'BUY') {
            pnl = (currentPrice - trade.entryPrice) * trade.quantity;
          } else {
            pnl = (trade.entryPrice - currentPrice) * trade.quantity;
          }
          
          const pnlInBrl = trade.symbol.includes('BRL')
            ? pnl
            : pnl * brlRate;

          // Se for Futuros, precisamos somar a margem de volta, pois ela foi debitada do virtualBalance na abertura.
          // No Spot, a margem é 0 (não definida), então não afeta o cálculo.
          const margin = (trade as ExtendedTrade).margin ? parseFloat((trade as ExtendedTrade).margin!) : 0;
          const marginInBrl = trade.symbol.includes('BRL') ? margin : margin * brlRate;

          return acc + pnlInBrl + marginInBrl;
        }
        return acc;
      }, 0);

    return {
      totalPnl,
      // IMPORTANTE: Number() para evitar concatenação de strings caso venha como string do banco/API
      patrimonioAtual: Number(simulatorProfile?.virtualBalance || 0) + unrealizedEquity,
    };
  }, [tradesWithDates, brlRate, binanceTickers, simulatorProfile]);

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
        <TradingPerformanceSummary trades={tradesWithDates} binanceTickers={binanceTickers} brlRate={brlRate} />
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
                    fill="#8884d8"
                  />
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