"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import styles from "./RecentOperationsTable.module.css";

// Estrutura de um Trade, conforme a API
interface Trade {
  id: string;
  symbol: string;
  type: string;
  status: 'OPEN' | 'CLOSED';
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
}

// Função para buscar os trades
const fetchTrades = async (): Promise<Trade[]> => {
  const response = await fetch("/api/trades");
  if (!response.ok) throw new Error("Falha ao buscar as operações.");
  return response.json();
};

// Helper para formatar moeda
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "N/A";

  // Aumenta a precisão para valores fracionários pequenos
  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6, // Mostra até 6 casas decimais se necessário
  };

  return new Intl.NumberFormat("pt-BR", options).format(value);
};

export const RecentOperationsTable = () => {
  const queryClient = useQueryClient();
  const { data: trades, isLoading, error } = useQuery<Trade[]>({ 
    queryKey: ['trades'], 
    queryFn: fetchTrades 
  });

  // Mutação para fechar (atualizar) um trade
  const closeTradeMutation = useMutation({
    mutationFn: (tradeId: string) => {
      return fetch(`/api/trades/${tradeId}`, {
        method: 'PUT',
      }).then(res => {
        if (!res.ok) throw new Error('Falha ao fechar a operação.');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
    },
    onError: (error: Error) => {
      alert(`Erro: ${error.message}`);
    }
  });

  const handleCloseTrade = (tradeId: string) => {
    if (confirm("Tem certeza que deseja fechar esta operação pelo preço de mercado atual?")) {
      closeTradeMutation.mutate(tradeId);
    }
  };

  const calculatePnlPercent = (trade: Trade): string => {
    if (trade.status !== 'CLOSED' || !trade.pnl) return "N/A";
    const initialCost = trade.entryPrice * trade.quantity;
    if (initialCost === 0) return "N/A";
    const percent = (trade.pnl / initialCost) * 100;
    return `${percent.toFixed(2)}%`;
  };

  const renderTableContent = () => {
    if (isLoading) return <TableRow><TableCell colSpan={9} className="text-center">Carregando...</TableCell></TableRow>;
    if (error) return <TableRow><TableCell colSpan={9} className="text-center text-red-500">Erro: {error.message}</TableCell></TableRow>;
    if (!trades || trades.length === 0) return <TableRow><TableCell colSpan={9} className="text-center">Nenhuma operação encontrada.</TableCell></TableRow>;

    return trades.map((trade) => {
      const pnl = trade.status === 'CLOSED' ? trade.pnl : null;
      const isProfit = pnl !== null && pnl >= 0;

      return (
        <TableRow key={trade.id}>
          <TableCell>{trade.symbol.replace("USDT", "")}</TableCell>
          <TableCell>{trade.type}</TableCell>
          <TableCell>{trade.quantity}</TableCell>
          <TableCell>{formatCurrency(trade.entryPrice)}</TableCell>
          <TableCell>{formatCurrency(trade.exitPrice)}</TableCell>
          <TableCell className={pnl !== null ? (isProfit ? styles.profit : styles.loss) : ''}>
            {formatCurrency(pnl)}
          </TableCell>
          <TableCell className={pnl !== null ? (isProfit ? styles.profit : styles.loss) : ''}>
            {calculatePnlPercent(trade)}
          </TableCell>
          <TableCell>
            <span className={`${styles.status} ${trade.status === 'CLOSED' ? styles.statusPaid : styles.statusPending}`}>
              {trade.status === 'CLOSED' ? 'Fechada' : 'Aberta'}
            </span>
          </TableCell>
          <TableCell>
            {trade.status === 'OPEN' && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleCloseTrade(trade.id)}
                disabled={closeTradeMutation.isPending && closeTradeMutation.variables === trade.id}
              >
                {closeTradeMutation.isPending && closeTradeMutation.variables === trade.id ? 'Fechando...' : 'Fechar'}
              </Button>
            )}
          </TableCell>
        </TableRow>
      );
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Crypto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Preço Entrada</TableHead>
              <TableHead>Preço Saída</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Resultado (%)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};