"use client";

import { useQuery } from "@tanstack/react-query";
import { calculateTradingStats } from "@/lib/trading-math";
import { TrendingUp, TrendingDown, Target, Activity, DollarSign, PieChart, AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Trade } from "@prisma/client";
import styles from "./TradingPerformanceSummary.module.css";

const fetchTrades = async (): Promise<Trade[]> => {
  const res = await fetch("/api/simulator/trades");
  if (!res.ok) throw new Error("Falha ao buscar trades.");
  return res.json();
};

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


interface TradingPerformanceSummaryProps {
  trades?: Trade[]; // Tornar trades um prop opcional
}

export const TradingPerformanceSummary: React.FC<TradingPerformanceSummaryProps> = ({ trades: propTrades }) => {
  const { data: fetchedTrades = [], isLoading, error } = useQuery<Trade[]>({
    queryKey: ["simulatorTrades"],
    queryFn: fetchTrades,
    enabled: !propTrades, // Apenas busca se os trades não forem fornecidos via prop
  });

  const tradesToUse = propTrades || fetchedTrades;

  if (isLoading && !propTrades) return <div className={styles.loadingMessage}>Carregando métricas de trading...</div>;
  if (error && !propTrades) return <div className={styles.errorMessage}>Erro ao carregar dados de trading.</div>;
  if (!tradesToUse.length && !isLoading && !error) return <div className={styles.noDataMessage}>Nenhum trade para analisar.</div>;

  const stats = calculateTradingStats(tradesToUse);

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
