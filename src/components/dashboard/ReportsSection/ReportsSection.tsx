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
import CapitalMovementForm from "@/components/CapitalMovementForm/CapitalMovementForm";
import Modal from "@/components/ui/modal/Modal";

// Interfaces
interface Trade {
  id: string;
  symbol: string;
  type: string;
  status: "OPEN" | "CLOSED";
  entryDate: string;
  exitDate?: string;
  quantity: number;
  pnl?: number;
}

interface CapitalMovement {
  id: string;
  amount: number;
  type: "DEPOSIT" | "WITHDRAWAL";
  date: string;
  description?: string;
}

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

const fetchCapitalMovements = async (): Promise<CapitalMovement[]> => {
  const res = await fetch("/api/capital-movements");
  if (!res.ok) throw new Error("Falha ao buscar movimentos de capital.");
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
  capitalMovements: CapitalMovement[],
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
    ...capitalMovements.map((m) => ({
      date: new Date(m.date),
      amount:
        m.type === "DEPOSIT" ? Number(m.amount) : -Number(m.amount),
    })),
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
  capitalMovements: CapitalMovement[],
  brlRate: number
) => {
  const monthlyMap: {
    [key: string]: {
      pnl: number;
      deposits: number;
      withdrawals: number;
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
          deposits: 0,
          withdrawals: 0,
          tradeCount: 0,
        };
      const pnlInBrl = trade.symbol.includes('BRL')
        ? Number(trade.pnl)
        : (Number(trade.pnl) || 0) * brlRate;
      monthlyMap[key].pnl += pnlInBrl;
      monthlyMap[key].tradeCount++;
    });

  capitalMovements.forEach((m) => {
    const date = new Date(m.date);
    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    if (!monthlyMap[key])
      monthlyMap[key] = {
        pnl: 0,
        deposits: 0,
        withdrawals: 0,
        tradeCount: 0,
      };
    if (m.type === "DEPOSIT") monthlyMap[key].deposits += Number(m.amount);
    else monthlyMap[key].withdrawals += Number(m.amount);
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

export const ReportsSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: trades = [],
    isLoading: l1,
    error: e1,
  } = useQuery<Trade[]>({ queryKey: ["trades"], queryFn: fetchTrades });
  const {
    data: capitalMovements = [],
    isLoading: l2,
    error: e2,
  } = useQuery<CapitalMovement[]>({
    queryKey: ["capitalMovements"],
    queryFn: fetchCapitalMovements,
  });
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

  const isLoading = l1 || l2 || l3 || l4;
  const error = e1 || e2 || e3 || e4;

  const brlRate = exchangeRateData?.usdtToBrl || 1;
  const openTrades = useMemo(
    () => trades.filter((t) => t.status === "OPEN"),
    [trades]
  );

  const performanceData = useMemo(
    () => generatePortfolioPerformanceData(trades, capitalMovements, brlRate),
    [trades, capitalMovements, brlRate]
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
    () => generateMonthlyReportData(trades, capitalMovements, brlRate),
    [trades, capitalMovements, brlRate]
  );

  const kpiData = useMemo(() => {
    // FIXME: The initial balance should come from a single source of truth, not be hardcoded.
    // This is a temporary fix for consistency with the portfolio evolution chart.
    const initialBalance = 1000; 

    const totalDeposits = capitalMovements
      .filter((m) => m.type === 'DEPOSIT')
      .reduce((acc, m) => acc + Number(m.amount), 0);

    const totalWithdrawals = capitalMovements
      .filter((m) => m.type === 'WITHDRAWAL')
      .reduce((acc, m) => acc + Number(m.amount), 0);

    const totalPnl = trades
      .filter((t) => t.status === 'CLOSED' && t.pnl != null)
      .reduce((acc, t) => {
        const pnlInBrl = t.symbol.includes('BRL')
          ? Number(t.pnl)
          : Number(t.pnl) * brlRate;
        return acc + pnlInBrl;
      }, 0);

    // Correctly include the initial balance in the total deposits and current equity
    const totalAportes = initialBalance + totalDeposits;
    const patrimonioAtual = totalAportes - totalWithdrawals + totalPnl;

    return {
      totalDeposits: totalAportes, // Renamed for clarity in the return object
      totalWithdrawals,
      totalPnl,
      patrimonioAtual,
    };
  }, [trades, capitalMovements, brlRate]);

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
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Registrar Movimento de Capital"
      >
        <CapitalMovementForm onFormSubmit={() => setIsModalOpen(false)} />
      </Modal>

      <div className={styles.headerContainer}>
        <h1 className={styles.mainTitle}>Relatórios</h1>
        <Button onClick={() => setIsModalOpen(true)}>Adicionar Movimentação</Button>
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
        <Card>
          <CardHeader>
            <CardTitle>Total de Aportes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.kpiValue}>{formatCurrency(kpiData.totalDeposits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total de Retiradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.kpiValue}>{formatCurrency(kpiData.totalWithdrawals)}</p>
          </CardContent>
        </Card>
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
                  formatter={(v: number) => [formatCurrency(v), "Saldo"]}
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
                    formatter={(v: number) => [formatCurrency(v), "Valor"]}
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
                formatter={(value: number, name: string) =>
                  name === "Trades" ? value : formatCurrency(value)
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
                yAxisId="left"
                dataKey="deposits"
                name="Aportes"
                fill="#8884d8"
              />
              <Bar
                yAxisId="left"
                dataKey="withdrawals"
                name="Retiradas"
                fill="#ff8042"
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
