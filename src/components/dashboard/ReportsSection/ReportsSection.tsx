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
  tickers: CryptoData[],
  brlRate: number
) => {
  const portfolio: { [key: string]: number } = {};
  openTrades.forEach((trade) => {
    const ticker = tickers.find((t) => t.symbol === trade.symbol);
    if (ticker) {
      const value = ticker.symbol.includes('BRL')
        ? parseFloat(trade.quantity) * parseFloat(ticker.price)
        : parseFloat(trade.quantity) * parseFloat(ticker.price) * brlRate;
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
  openPositions: any[]; 
}

interface ReportsSectionProps {
  trades: Trade[];
  binanceTickers: CryptoData[];
  isLoadingTrades: boolean;
  isLoadingBinanceTickers: boolean;
  errorTrades: Error | null;
  simulatorProfile: SimulatorProfile | undefined; // Make it optional as it might be loading
  isLoadingSimulator: boolean;
  errorSimulator: Error | null;
}

export const ReportsSection = ({
