import { useState, useMemo } from "react";
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
} from "recharts";
import styles from "./ReportsSection.module.css";

// --- Mock Data ---
// In a real app, this would come from an API and be processed.
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

// --- (Other chart data remains the same) ---
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

export const ReportsSection = () => {
  const [timeframe, setTimeframe] = useState("Mensal");

  const timeframes = ["Diário", "Semanal", "Mensal", "Anual"];

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

  return (
    <div className={styles.reportsSection}>
      {/* ... (Charts remain the same) ... */}

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
                    <TableCell className={styles.positiveValue}>R$ {item.lucro.toLocaleString()},00</TableCell>
                    <TableCell className={styles.negativeValue}>R$ {item.prejuizo.toLocaleString()},00</TableCell>
                    <TableCell className={resultado >= 0 ? styles.positiveValue : styles.negativeValue}>
                      R$ {resultado.toLocaleString()},00
                    </TableCell>
                    <TableCell className={styles.positiveValue}>{item.retorno}%</TableCell>
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