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
  const data = await response.json();
  // --- DEBUG LOG ---
  console.log("Raw trades data from API:", data);
  // --- END DEBUG LOG ---
  return data.map((trade: any) => ({
    ...trade,
    entryPrice: parseFloat(trade.entryPrice) || 0,
    exitPrice: trade.exitPrice != null ? parseFloat(trade.exitPrice) : null,
    quantity: parseFloat(trade.quantity) || 0,
    pnl: trade.pnl != null ? parseFloat(trade.pnl) : null,
  }));
};

// Helper para formatar moeda
const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "N/A";

  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  };

  if (Math.abs(value) < 1.0) {
    options.maximumFractionDigits = 8;
  } else {
    options.maximumFractionDigits = 2;
  }

  return new Intl.NumberFormat("pt-BR", options).format(value);
};

// Helper para formatar data e hora
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface CryptoData {
  symbol: string;
  lastPrice: string;
}

const fetchCryptoData = async (symbols: string[]): Promise<CryptoData[]> => {
  const response = await fetch("https://api.binance.com/api/v3/ticker/24hr");
  if (!response.ok) {
    throw new Error("Erro ao buscar dados da Binance API");
  }
  const data = await response.json();
  return data.filter((crypto: any) => symbols.includes(crypto.symbol));
};

export const RecentOperationsTable = () => {
  const queryClient = useQueryClient();

  const { data: exchangeRateData } = useQuery({
    queryKey: ["exchangeRate"],
    queryFn: async () => {
      const response = await fetch("/api/exchange-rate");
      if (!response.ok) throw new Error("Failed to fetch exchange rate");
      return response.json();
    },
    refetchInterval: 60000,
  });

  const { data: trades, isLoading: isLoadingTrades, error: errorTrades } = useQuery<Trade[]>({
    queryKey: ['trades'],
    queryKey: ['trades', exchangeRateData],
    queryFn: async () => {
      const data = await fetchTrades();
      const brlRate = exchangeRateData?.usdtToBrl || 1;
      return data.map(trade => ({
        ...trade,
        entryPrice: trade.entryPrice * brlRate,
        exitPrice: trade.exitPrice ? trade.exitPrice * brlRate : undefined,
        pnl: trade.pnl ? trade.pnl * brlRate : undefined,
      }));
    },
    enabled: !!exchangeRateData,
  });

  const symbols = trades?.filter(t => t.status === 'OPEN').map(t => t.symbol) || [];
  const { data: cryptoData, isLoading: isLoadingCryptoData } = useQuery<CryptoData[]>({ 
    queryKey: ['cryptoData', symbols], 
    queryFn: () => fetchCryptoData(symbols),
    enabled: symbols.length > 0,
    refetchInterval: 30000,
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

  const calculatePnlPercent = (trade: Trade, currentPrice?: number): string => {
    const initialCost = trade.entryPrice * trade.quantity;
    if (initialCost === 0) return "N/A";

    if (trade.status === 'CLOSED' && trade.pnl) {
      const percent = (trade.pnl / initialCost) * 100;
      return `${percent.toFixed(2)}%`;
    }

    if (trade.status === 'OPEN' && currentPrice) {
      const pnl = (trade.type === 'compra' ? (currentPrice - trade.entryPrice) : (trade.entryPrice - currentPrice)) * trade.quantity;
      const percent = (pnl / initialCost) * 100;
      return `${percent.toFixed(2)}%`;
    }

    return "N/A";
  };

  const renderTableContent = () => {
    const isLoading = isLoadingTrades || isLoadingCryptoData;
    if (isLoading) return <TableRow><TableCell colSpan={11} className="text-center">Carregando...</TableCell></TableRow>;
    if (errorTrades) return <TableRow><TableCell colSpan={11} className="text-center text-red-500">Erro: {errorTrades.message}</TableCell></TableRow>;
    if (!trades || trades.length === 0) return <TableRow><TableCell colSpan={11} className="text-center">Nenhuma operação encontrada.</TableCell></TableRow>;

    return trades.map((trade) => {
      const currentCrypto = cryptoData?.find(c => c.symbol === trade.symbol);
      const currentPrice = currentCrypto ? parseFloat(currentCrypto.lastPrice) * (exchangeRateData?.usdtToBrl || 1) : undefined;

      let pnl = null;
      if (trade.status === 'CLOSED') {
        pnl = trade.pnl;
      } else if (trade.status === 'OPEN' && currentPrice) {
        pnl = (trade.type === 'compra' ? (currentPrice - trade.entryPrice) : (trade.entryPrice - currentPrice)) * trade.quantity;
      }

      const isProfit = pnl !== null && pnl >= 0;

      return (
        <TableRow key={trade.id}>
          <TableCell>{trade.symbol.replace("USDT", "")}</TableCell>
          <TableCell>{trade.type}</TableCell>
          <TableCell>{trade.quantity}</TableCell>
          <TableCell>{formatCurrency(trade.entryPrice * trade.quantity)}</TableCell>
          <TableCell>{formatCurrency(trade.exitPrice ? trade.exitPrice * trade.quantity : null)}</TableCell>
          <TableCell>{formatCurrency(currentPrice)}</TableCell>
          <TableCell className={pnl !== null ? (isProfit ? styles.profit : styles.loss) : ''}>
            {formatCurrency(pnl)}
          </TableCell>
          <TableCell className={pnl !== null ? (isProfit ? styles.profit : styles.loss) : ''}>
            {calculatePnlPercent(trade, currentPrice)}
          </TableCell>
          <TableCell>
            <span className={`${styles.status} ${trade.status === 'CLOSED' ? styles.statusPaid : styles.statusPending}`}>
              {trade.status === 'CLOSED' ? 'Fechada' : 'Aberta'}
            </span>
          </TableCell>
          <TableCell>
            {trade.status === 'OPEN'
              ? formatDate(trade.entryDate)
              : `${formatDate(trade.entryDate)} -> ${formatDate(trade.exitDate)}`}
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
              <TableHead>Valor Entrada</TableHead>
              <TableHead>Valor Saída</TableHead>
              <TableHead>Preço Atual</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Resultado (%)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data/Hora</TableHead>
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