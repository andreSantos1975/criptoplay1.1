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

const monthlyData = [
  { mes: "Julho 2025", operacoes: 45, lucro: 4500, prejuizo: 1200, retorno: 7.5 },
  { mes: "Agosto 2025", operacoes: 38, lucro: 3200, prejuizo: 900, retorno: 6.8 },
];

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
  return (
    <div className={styles.reportsSection}>
      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Monthly Profit/Loss Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Lucros e Prejuízos Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profitLossData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="profit" fill="hsl(var(--chart-green))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="loss" fill="hsl(var(--chart-red))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Crypto Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Criptomoeda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cryptoDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {cryptoDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment vs Returns Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Investimentos vs Retornos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={investmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="investment"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="returns"
                  stroke="hsl(var(--chart-green))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead>Operações</TableHead>
                <TableHead>Lucro</TableHead>
                <TableHead>Prejuízo</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Retorno (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyData.map((item, index) => {
                const resultado = item.lucro - item.prejuizo;
                return (
                  <TableRow key={index}>
                    <TableCell>{item.mes}</TableCell>
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