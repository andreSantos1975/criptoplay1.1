import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import styles from "./PersonalFinanceTable.module.css";

interface FinanceItem {
  id: string;
  categoria: string;
  valor: string;
  dataVencimento: string;
  status: "Pendente" | "Pago";
}

const financeData: FinanceItem[] = [
  {
    id: "1",
    categoria: "Conta de Água",
    valor: "R$ 150,00",
    dataVencimento: "10/08/2025",
    status: "Pendente",
  },
  {
    id: "2",
    categoria: "Conta de Energia",
    valor: "R$ 320,00",
    dataVencimento: "12/08/2025",
    status: "Pago",
  },
  {
    id: "3",
    categoria: "Gás",
    valor: "R$ 120,00",
    dataVencimento: "15/08/2025",
    status: "Pendente",
  },
  {
    id: "4",
    categoria: "Despesas Gerais",
    valor: "R$ 800,00",
    dataVencimento: "30/08/2025",
    status: "Pendente",
  },
];

export const PersonalFinanceTable = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Controle de Finanças Pessoais</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data de Vencimento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financeData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.categoria}</TableCell>
                <TableCell>{item.valor}</TableCell>
                <TableCell>{item.dataVencimento}</TableCell>
                <TableCell>
                  <span
                    className={`${styles.status} ${
                      item.status === "Pago"
                        ? styles.statusPaid
                        : styles.statusPending
                    }`}
                  >
                    {item.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
