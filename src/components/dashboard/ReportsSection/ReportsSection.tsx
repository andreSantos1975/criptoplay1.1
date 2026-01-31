"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import styles from "./ReportsSection.module.css";
import { TradingPerformanceSummary } from "@/components/reports/TradingPerformanceSummary"; 

// Helper de formatação permanece no cliente para exibição.
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

// A interface de props agora é muito mais simples.
interface ReportsSectionProps {
  stats: any; // O objeto completo e pré-calculado de userTradingStats
  isLoading: boolean; // Um único indicador de carregamento
  error: Error | null;
}

export const ReportsSection = ({
  stats,
  isLoading,
  error,
}: ReportsSectionProps) => {

  if (isLoading)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando Relatórios...</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Buscando e processando seu histórico de trades...</p>
        </CardContent>
      </Card>
    );
    
  if (error)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro ao Carregar Relatório</CardTitle>
        </CardHeader>
        <CardContent>{error.message}</CardContent>
      </Card>
    );

  // Verificação para o caso de stats ainda ser nulo/undefined após o carregamento
  if (!stats) {
    return (
        <Card>
            <CardHeader><CardTitle>Nenhum dado para exibir</CardTitle></CardHeader>
            <CardContent><p>Não encontramos dados de trades para gerar seu relatório.</p></CardContent>
        </Card>
    );
  }

  return (
    <div className={styles.reportsSection}>
      <div className={styles.headerContainer}>
        <h1 className={styles.mainTitle}>Relatórios Consolidados</h1>
      </div>

      {/* KPIs agora usam 100% dados do backend */}
      <div className={styles.kpiGrid}>
        <Card>
          <CardHeader>
            <CardTitle>Patrimônio (Realizado)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={styles.kpiValue}>{formatCurrency(stats.currentEquity ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resultado (Realizado)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`${styles.kpiValue} ${stats.totalPnl >= 0 ? styles.positive : styles.negative}`}>
              {formatCurrency(stats.totalPnl ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Avançada com dados do backend */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Performance Avançada</h2>
        <TradingPerformanceSummary stats={stats} />
      </div>

      {/* Gráfico de Evolução do Patrimônio com dados do backend */}
      <div className={styles.chartsGrid}>
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Patrimônio (Trades Fechados)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.equityCurveData} margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  formatter={(value) => {
                    if (typeof value === 'number') {
                      return [formatCurrency(value), "Saldo"];
                    }
                    return [null, null]; // Evita erro quando o valor é undefined
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Saldo"
                  name="Patrimônio Realizado"
                  stroke="#8884d8"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Outros gráficos como Distribuição da Carteira podem ser adicionados aqui depois */}
      </div>

    </div>
  );
};