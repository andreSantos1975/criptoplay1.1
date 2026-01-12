"use client";

import { useMemo } from "react"; // Removed useQuery
import { calculateTradingStats } from "@/lib/trading-math";
import { TrendingUp, TrendingDown, Target, Activity, DollarSign, PieChart, AlertTriangle, ArrowRightLeft } from "lucide-react";
import type { Trade } from "@/types/trade";
import styles from "./TradingPerformanceSummary.module.css";

// Interface for CryptoData if needed internally for new calculations.
// For now, it's enough to pass brlRate to normalize trades.
interface CryptoData {
  symbol: string;
  price: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatNumber = (value: number, decimals = 2) => {
  if (value === Infinity) return "∞";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

interface TradingCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description: string;
    valueClassName?: string;
}

const TradingCard: React.FC<TradingCardProps> = ({ title, value, icon: Icon, description, valueClassName }) => (
    <div className={styles.card}>
        <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{title}</h3>
            <Icon className={`${styles.cardIcon} ${valueClassName}`} />
        </div>
        <div className={styles.cardContent}>
            <div className={`${styles.cardValue} ${valueClassName}`}>{value}</div>
            <p className={styles.cardDescription}>{description}</p>
        </div>
    </div>
);


// Define ProcessedTrade to match the data after date/decimal conversion
export interface ProcessedTrade {
  id: string;
  symbol: string;
  type: string;
  status: string;
  entryDate: Date;
  exitDate?: Date | null;
  entryPrice: number;
  exitPrice?: number | null;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  pnl?: number | null;
  notes?: string | null;
  sentiment?: string | null;
  strategy: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  marketType: string;
  isSimulator: boolean;
}

export interface TradingPerformanceSummaryProps {
  trades: ProcessedTrade[];
  binanceTickers: CryptoData[]; // Added for consistency and potential future use
  brlRate: number;
}

export const TradingPerformanceSummary: React.FC<TradingPerformanceSummaryProps> = ({ trades, brlRate }) => {


  // Normalizar trades para BRL uma única vez
  const normalizedTrades = useMemo(() => {
    return trades.map(t => {
      // Se já fechou e tem PnL
      if (t.status === 'CLOSED' && t.pnl !== null) {
        const pnlNum = Number(t.pnl);
        // Se for par USDT (ex: BTCUSDT), converte. Se for BRL (ex: BTCBRL), mantém. 
        const isBrl = t.symbol.endsWith('BRL'); 
        const normalizedPnl = isBrl ? pnlNum : pnlNum * brlRate;
        
        // Retorna um novo objeto trade com o pnl ajustado (apenas para visualização)
        return {
          ...t,
          pnl: normalizedPnl // Substitui o valor decimal/original pelo valor em BRL number
        } as unknown as Trade; // Cast para Trade (pnl no prisma é Decimal, aqui virou number, mas ok para o frontend)
      }
      return t;
    });
  }, [trades, brlRate]);

  const stats = calculateTradingStats(normalizedTrades);

  const cardsData = [
    {
      title: "Total de Trades",
      value: stats.totalTrades,
      icon: ArrowRightLeft,
      description: "Operações fechadas",
      valueClassName: styles.textBlue,
    },
    {
      title: "Taxa de Acerto (Win Rate)",
      value: `${formatNumber(stats.winRate)}%`,
      icon: PieChart,
      description: "Precisão dos trades",
      valueClassName: stats.winRate >= 50 ? styles.textGreen : styles.textRed,
    },
    {
      title: "Fator de Lucro",
      value: formatNumber(stats.profitFactor),
      icon: TrendingUp,
      description: "Lucro Bruto / Prejuízo Bruto",
      valueClassName: stats.profitFactor >= 1.5 ? styles.textGreen600 : stats.profitFactor >= 1 ? styles.textYellow600 : styles.textRed600,
    },
    {
      title: "Payoff (Risco:Retorno)",
      value: formatNumber(stats.payoff),
      icon: Target,
      description: "Média Ganho / Média Perda",
      valueClassName: stats.payoff >= 1.5 ? styles.textGreen600 : styles.textYellow600,
    },
    {
      title: "Drawdown Máximo",
      value: formatCurrency(stats.maxDrawdown),
      icon: TrendingDown,
      description: "Maior queda de capital",
      valueClassName: styles.textRed,
    },
    {
      title: "Expectativa Matemática",
      value: formatCurrency(stats.expectancy),
      icon: Activity,
      description: "Valor esperado por trade",
      valueClassName: stats.expectancy > 0 ? styles.textGreen : styles.textRed,
    },
    {
      title: "Melhor Trade",
      value: formatCurrency(stats.bestTrade),
      icon: DollarSign,
      description: "Maior lucro em uma operação",
      valueClassName: styles.textGreen,
    },
    {
      title: "Pior Trade",
      value: formatCurrency(stats.worstTrade),
      icon: AlertTriangle,
      description: "Maior prejuízo em uma operação",
      valueClassName: styles.textRed,
    },
  ];

  return (
    <div className={styles.summaryGrid}>
      {cardsData.map((card, index) => (
        <TradingCard key={index} {...card} />
      ))}
    </div>
  );
};
