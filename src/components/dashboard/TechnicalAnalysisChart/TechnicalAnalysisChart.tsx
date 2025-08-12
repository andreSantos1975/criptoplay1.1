import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import styles from "./TechnicalAnalysisChart.module.css";

const chartData = [
  { time: "09:00", price: 45000, volume: 1200 },
  { time: "10:00", price: 45500, volume: 1500 },
  { time: "11:00", price: 44800, volume: 900 },
  { time: "12:00", price: 46200, volume: 1800 },
  { time: "13:00", price: 47100, volume: 2100 },
  { time: "14:00", price: 46800, volume: 1600 },
  { time: "15:00", price: 48200, volume: 2400 },
  { time: "16:00", price: 47900, volume: 1900 },
];

export const TechnicalAnalysisChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise Técnica - BTC/USD</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={['dataMin - 500', 'dataMax + 500']}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--foreground))"
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--chart-green))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "hsl(var(--chart-green))", strokeWidth: 2, fill: "hsl(var(--chart-green))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <p className={styles.metricLabel}>Preço Atual</p>
            <p className={`${styles.metricValue} ${styles.positiveValue}`}>$47.900</p>
          </div>
          <div className={styles.metricItem}>
            <p className={styles.metricLabel}>Variação 24h</p>
            <p className={`${styles.metricValue} ${styles.positiveValue}`}>+2.5%</p>
          </div>
          <div className={styles.metricItem}>
            <p className={styles.metricLabel}>Volume</p>
            <p className={styles.metricValue}>1.9K</p>
          </div>
          <div className={styles.metricItem}>
            <p className={styles.metricLabel}>RSI</p>
            <p className={styles.metricValue}>65.2</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};