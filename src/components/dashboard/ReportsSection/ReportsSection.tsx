"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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

// Interfaces
interface Trade {
  id: string;
  symbol: string;
  type: string;
  status: 'OPEN' | 'CLOSED';
  entryDate: string;
  exitDate?: string;
  quantity: number;
  pnl?: number;
}

interface CapitalMovement {
  id: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  date: string;
}

interface BinanceTicker {
    symbol: string;
    lastPrice: string;
}

// Data Fetching
const fetchTrades = async (): Promise<Trade[]> => {
  const res = await fetch("/api/trades");
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

// Helper
const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Data Processing
const generatePortfolioPerformanceData = (trades: Trade[], capitalMovements: CapitalMovement[], brlRate: number) => {
  const events = [
    ...trades.filter(t => t.status === 'CLOSED' && t.pnl != null).map(t => ({ date: new Date(t.exitDate!), amount: (Number(t.pnl) || 0) * brlRate })),
    ...capitalMovements.map(m => ({ date: new Date(m.date), amount: m.type === 'DEPOSIT' ? Number(m.amount) : -Number(m.amount) }))
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  if (events.length === 0) return [{ date: "Início", Saldo: 0 }];

  let balance = 0;
  const performance = events.map(e => {
    balance += e.amount;
    return { date: e.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), Saldo: balance };
  });

  return [{ date: "Início", Saldo: 0 }, ...performance];
};

const generatePortfolioDistributionData = (openTrades: Trade[], tickers: BinanceTicker[], brlRate: number) => {
  const portfolio: { [key: string]: number } = {};
  openTrades.forEach(trade => {
    const ticker = tickers.find(t => t.symbol === trade.symbol);
    if (ticker) {
      const value = (parseFloat(trade.quantity.toString()) * parseFloat(ticker.lastPrice)) * brlRate;
      const asset = trade.symbol.replace("USDT", "");
      portfolio[asset] = (portfolio[asset] || 0) + value;
    }
  });

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE"];
  return Object.entries(portfolio).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
};

const generateMonthlyReportData = (trades: Trade[], capitalMovements: CapitalMovement[], brlRate: number) => {
    const monthlyMap: { [key: string]: { pnl: number; deposits: number; withdrawals: number; tradeCount: number } } = {};

    trades.filter(t => t.status === 'CLOSED' && t.pnl != null).forEach(trade => {
        const date = new Date(trade.exitDate!)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[key]) monthlyMap[key] = { pnl: 0, deposits: 0, withdrawals: 0, tradeCount: 0 };
        monthlyMap[key].pnl += (Number(trade.pnl) || 0) * brlRate;
        monthlyMap[key].tradeCount++;
    });

    capitalMovements.forEach(m => {
        const date = new Date(m.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap[key]) monthlyMap[key] = { pnl: 0, deposits: 0, withdrawals: 0, tradeCount: 0 };
        if (m.type === 'DEPOSIT') monthlyMap[key].deposits += Number(m.amount);
        else monthlyMap[key].withdrawals += Number(m.amount);
    });

    return Object.entries(monthlyMap).map(([key, value]) => ({
        month: new Date(key + '-02').toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).replace('. de', '/'),
        ...value
    })).sort((a, b) => a.month.localeCompare(b.month));
};

export const ReportsSection = () => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [description, setDescription] = useState('');

  const { data: trades = [], isLoading: l1, error: e1 } = useQuery<Trade[]>({ queryKey: ['trades'], queryFn: fetchTrades });
  const { data: capitalMovements = [], isLoading: l2, error: e2 } = useQuery<CapitalMovement[]>({ queryKey: ['capitalMovements'], queryFn: fetchCapitalMovements });
  const { data: exchangeRateData, isLoading: l3, error: e3 } = useQuery({ queryKey: ["exchangeRate"], queryFn: async () => (await fetch("/api/exchange-rate")).json() });
  const { data: binanceTickers = [], isLoading: l4, error: e4 } = useQuery<BinanceTicker[]>({ queryKey: ['binanceTickers'], queryFn: fetchBinanceTickers });

  const isLoading = l1 || l2 || l3 || l4;
  const error = e1 || e2 || e3 || e4;

  const brlRate = exchangeRateData?.usdtToBrl || 1;
  const openTrades = useMemo(() => trades.filter(t => t.status === 'OPEN'), [trades]);

  const performanceData = useMemo(() => generatePortfolioPerformanceData(trades, capitalMovements, brlRate), [trades, capitalMovements, brlRate]);
  const distributionData = useMemo(() => generatePortfolioDistributionData(openTrades, binanceTickers, brlRate), [openTrades, binanceTickers, brlRate]);
  const monthlyReportData = useMemo(() => generateMonthlyReportData(trades, capitalMovements, brlRate), [trades, capitalMovements, brlRate]);

  const { mutate, isPending } = useMutation({
    mutationFn: (newMovement: Omit<CapitalMovement, 'id' | 'date'> & { date: string }) => fetch('/api/capital-movements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMovement) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['capitalMovements', 'trades'] }); alert('Movimento registrado!'); setAmount(''); setDescription(''); },
    onError: (err) => alert(`Erro: ${err.message}`)
  });

  if (isLoading) return <Card><CardHeader><CardTitle>Carregando Relatórios...</CardTitle></CardHeader></Card>;
  if (error) return <Card><CardHeader><CardTitle>Erro</CardTitle></CardHeader><CardContent>{error.message}</CardContent></Card>;

  return (
    <div className={styles.reportsSection}>
        <Card className={styles.formCard}>
            <CardHeader><CardTitle>Registrar Movimento de Capital</CardTitle></CardHeader>
            <CardContent>
                <form onSubmit={e => { e.preventDefault(); mutate({ amount: parseFloat(amount.replace(',', '.')), type, description, date: new Date().toISOString() }); }} className={styles.formGrid}>
                    <div className={styles.inputGroup}><label>Valor (R$)</label><input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="100,00" required className={styles.input}/></div>
                    <div className={styles.inputGroup}><label>Tipo</label><select value={type} onChange={e => setType(e.target.value as any)} required className={styles.select}><option value="DEPOSIT">Aporte</option><option value="WITHDRAWAL">Retirada</option></select></div>
                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}><label>Descrição</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Aporte inicial" className={styles.textarea}></textarea></div>
                    <Button type="submit" disabled={isPending} className={styles.submitButton} style={{ gridColumn: 'span 2' }}>{isPending ? 'Registrando...' : 'Registrar'}</Button>
                </form>
            </CardContent>
        </Card>

        <div className={styles.chartsGrid}>
            <Card>
                <CardHeader><CardTitle>Evolução do Patrimônio</CardTitle></CardHeader>
                <CardContent><ResponsiveContainer width="100%" height={300}><LineChart data={performanceData}><CartesianGrid/><XAxis dataKey="date"/><YAxis tickFormatter={formatCurrency}/><Tooltip formatter={(v:any) => [formatCurrency(v), "Saldo"]}/><Legend/><Line type="monotone" dataKey="Saldo" name="Saldo da Carteira" stroke="#8884d8"/></LineChart></ResponsiveContainer></CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Distribuição da Carteira (Aberto)</CardTitle></CardHeader>
                <CardContent>
                    {distributionData.length > 0 ? 
                        <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}><Cell fill="#8884d8"/><Cell fill="#82ca9d"/></Pie><Tooltip formatter={(v:any) => [formatCurrency(v), "Valor"]}/><Legend/></PieChart></ResponsiveContainer> : 
                        <div className={styles.noData}>Nenhuma posição aberta.</div>}
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader><CardTitle>Relatório Mensal</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyReportData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" tickFormatter={formatCurrency} />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={(value: any, name: string) => name === 'Trades' ? value : formatCurrency(value)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="pnl" name="Lucro/Prejuízo" fill="#82ca9d" />
                        <Bar yAxisId="left" dataKey="deposits" name="Aportes" fill="#8884d8" />
                        <Bar yAxisId="left" dataKey="withdrawals" name="Retiradas" fill="#ff8042" />
                        <Bar yAxisId="right" dataKey="tradeCount" name="Trades" fill="#ffc658" />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    </div>
  );
};