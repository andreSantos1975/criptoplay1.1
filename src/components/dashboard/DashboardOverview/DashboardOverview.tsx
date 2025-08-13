import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import styles from "./DashboardOverview.module.css";

const performanceData = [
  { date: "Jan", portfolio: 25000 },
  { date: "Fev", portfolio: 27500 },
  { date: "Mar", portfolio: 29800 },
  { date: "Abr", portfolio: 32100 },
  { date: "Mai", portfolio: 35200 },
  { date: "Jun", portfolio: 37530 },
];

const recentTrades = [
  { crypto: "BTC", tipo: "Compra", quantidade: "0.5", preco: "R$ 240.000", resultado: "+R$ 2.400" },
  { crypto: "ETH", tipo: "Venda", quantidade: "2.0", preco: "R$ 12.500", resultado: "+R$ 850" },
  { crypto: "ADA", tipo: "Compra", quantidade: "1000", preco: "R$ 2.800", resultado: "-R$ 120" },
  { crypto: "SOL", tipo: "Venda", quantidade: "5.0", preco: "R$ 890", resultado: "+R$ 340" },
];

// Helper function to calculate percentage
const calculatePercentage = (precoStr: string, quantidadeStr: string, resultadoStr: string): string => {
  try {
    const cleanString = (str: string) => str.replace(/[^0-9,-]+/g, "").replace(".", "").replace(",", ".");
    
    const preco = parseFloat(cleanString(precoStr));
    const quantidade = parseFloat(cleanString(quantidadeStr));
    const resultado = parseFloat(cleanString(resultadoStr));

    if (isNaN(preco) || isNaN(quantidade) || isNaN(resultado) || preco === 0 || quantidade === 0) {
      return "-";
    }

    const totalCost = preco * quantidade;
    if (totalCost === 0) return "-";

    const percentage = (resultado / totalCost) * 100;
    const sign = percentage > 0 ? "+" : "";
    return `${sign}${percentage.toFixed(2)}%`;
  } catch (error) {
    return "-";
  }
};

export const DashboardOverview = () => {
  return (
    <div className={styles.overviewContainer}>
      {/* Portfolio Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Portfólio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-green))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-green))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$ ${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [
                    `R$ ${value.toLocaleString('pt-BR')}`,
                    "Portfólio",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="portfolio"
                  stroke="hsl(var(--chart-green))"
                  fillOpacity={1}
                  fill="url(#portfolioGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Operações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr className={styles.tableRow}>
                  <th className={styles.tableHeader}>Crypto</th>
                  <th className={styles.tableHeader}>Tipo</th>
                  <th className={styles.tableHeader}>Quantidade</th>
                  <th className={styles.tableHeader}>Preço</th>
                  <th className={styles.tableHeader}>Resultado</th>
                  <th className={styles.tableHeader}>Resultado (%)</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade, index) => {
                  const percentageResult = calculatePercentage(trade.preco, trade.quantidade, trade.resultado);
                  return (
                    <tr key={index} className={styles.tableRow}>
                      <td className={styles.tableCellContent}>{trade.crypto}</td>
                      <td className={styles.tableCell}>
                        <span
                          className={`${styles.tradeType} ${
                            trade.tipo === "Compra"
                              ? styles.buyType
                              : styles.sellType
                          }`}
                        >
                          {trade.tipo}
                        </span>
                      </td>
                      <td className={styles.tableCell}>{trade.quantidade}</td>
                      <td className={styles.tableCell}>{trade.preco}</td>
                      <td
                        className={`${styles.tableCellContent} ${
                          trade.resultado.startsWith("+")
                            ? styles.positiveValue
                            : styles.negativeValue
                        }`}
                      >
                        {trade.resultado}
                      </td>
                      <td
                        className={`${styles.tableCellContent} ${
                          percentageResult.startsWith("+")
                            ? styles.positiveValue
                            : styles.negativeValue
                        }`}
                      >
                        {percentageResult}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};