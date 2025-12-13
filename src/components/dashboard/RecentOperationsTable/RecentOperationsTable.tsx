"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
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
import Modal from "@/components/ui/modal/Modal"; // Import the modal
import styles from "./RecentOperationsTable.module.css";

// Estrutura de um Trade, conforme a API
interface Trade {
  id: string;
  symbol: string;
  type: string;
  marketType: string;
  status: 'OPEN' | 'CLOSED';
  entryDate: string;
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  stopLoss: number;
  takeProfit: number;
  notes?: string;
}

// Função para buscar os trades
const fetchTrades = async (): Promise<Trade[]> => {
  const response = await fetch("/api/trades");
  if (!response.ok) throw new Error("Falha ao buscar as operações.");
  const data = await response.json();
  return data;
};

// Helper para formatar moeda
const formatCurrency = (value: number | null | undefined, currencyCode: string = "BRL", locale: string = "pt-BR") => {
  if (value === null || value === undefined) return "N/A";

  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 8, // Ajustado para exibir mais casas decimais para criptomoedas de baixo valor
  };

  return new Intl.NumberFormat(locale, options).format(value);
};

// Helper para formatar totais em moeda (sempre 2 casas decimais)
const formatTotalCurrency = (value: number | null | undefined, currencyCode: string = "BRL", locale: string = "pt-BR") => {
  if (value === null || value === undefined) return "N/A";

  const options: Intl.NumberFormatOptions = {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2, // Sempre 2 para totais
  };

  return new Intl.NumberFormat(locale, options).format(value);
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
  return data.filter((crypto: CryptoData) => symbols.includes(crypto.symbol));
};



export const RecentOperationsTable = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [tradeToClose, setTradeToClose] = useState<string | null>(null);

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
    queryKey: ['trades', exchangeRateData],
    queryFn: async () => {
      const data = await fetchTrades();
      // Não há conversão aqui, os preços permanecem em sua moeda original
      return data;
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
      toast.success("Operação fechada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    }
  });

  const handleCloseTrade = (tradeId: string) => {
    setTradeToClose(tradeId);
    setIsConfirmModalOpen(true);
  };

  const confirmCloseTrade = () => {
    if (tradeToClose) {
      closeTradeMutation.mutate(tradeToClose);
    }
    setIsConfirmModalOpen(false);
  };

  const handleRowClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };

  const calculatePnlPercent = (trade: Trade, currentPrice?: number): string => {
    // Determine the base currency for calculation (e.g., USD for USDT/FUTURES, BRL for BRL pairs)
    const baseCurrencyEntryPrice = trade.entryPrice;
    const baseCurrencyCurrentPrice = currentPrice; // currentPrice already comes in the trade's original currency
    
    const initialCost = baseCurrencyEntryPrice * trade.quantity;
    if (initialCost === 0) return "N/A";

    // Use trade.pnl which should be in the original currency, or calculate based on original currency prices
    if (trade.status === 'CLOSED' && trade.pnl !== undefined && trade.pnl !== null) {
      const percent = (trade.pnl / initialCost) * 100;
      return `${percent.toFixed(2)}%`;
    }

    if (trade.status === 'OPEN' && baseCurrencyCurrentPrice !== undefined) {
      const isBuy = trade.type.toLowerCase() === 'compra' || trade.type.toLowerCase() === 'buy';
      const pnl = (isBuy ? (baseCurrencyCurrentPrice - baseCurrencyEntryPrice) : (baseCurrencyEntryPrice - baseCurrencyCurrentPrice)) * trade.quantity;
      const percent = (pnl / initialCost) * 100;
      return `${percent.toFixed(2)}%`;
    }

    return "N/A";
  };

  const getCurrencyDetails = (trade: Trade) => {
    const isUSDT = trade.symbol.endsWith('USDT') || trade.marketType === 'FUTURES';
    return {
      currencyCode: isUSDT ? 'USD' : 'BRL',
      locale: isUSDT ? 'en-US' : 'pt-BR'
    };
  };

  const renderTableContent = () => {
    const isLoading = isLoadingTrades || isLoadingCryptoData;
    if (isLoading) return <TableRow><TableCell colSpan={activeTab === 'open' ? 12 : 9} className="text-center">Carregando...</TableCell></TableRow>;
    if (errorTrades) return <TableRow><TableCell colSpan={activeTab === 'open' ? 12 : 9} className="text-center text-red-500">Erro: {errorTrades.message}</TableCell></TableRow>;
    if (!trades || trades.length === 0) return <TableRow><TableCell colSpan={activeTab === 'open' ? 12 : 9} className="text-center">Nenhuma operação encontrada.</TableCell></TableRow>;

    const filteredTrades = trades.filter(trade => {
      if (activeTab === 'open') {
        return trade.status === 'OPEN';
      } else {
        return trade.status === 'CLOSED';
      }
    });

    if (filteredTrades.length === 0) return <TableRow><TableCell colSpan={activeTab === 'open' ? 12 : 9} className="text-center">Nenhuma operação encontrada para esta categoria.</TableCell></TableRow>;

    return filteredTrades.map((trade) => {
      const { currencyCode, locale } = getCurrencyDetails(trade);
      const brlRate = exchangeRateData?.usdtToBrl || 1;

      // Current crypto price in its original currency (USD or BRL)
      const currentCryptoData = cryptoData?.find(c => c.symbol === trade.symbol);
      let currentPriceInOriginalCurrency: number | undefined;
      if (currentCryptoData) {
        currentPriceInOriginalCurrency = parseFloat(currentCryptoData.lastPrice);
      }
      
      let pnl = null;
      if (trade.status === 'CLOSED') {
        pnl = trade.pnl;
      } else if (trade.status === 'OPEN' && currentPriceInOriginalCurrency !== undefined) {
        const isBuy = trade.type.toLowerCase() === 'compra' || trade.type.toLowerCase() === 'buy';
        pnl = (isBuy ? (currentPriceInOriginalCurrency - trade.entryPrice) : (trade.entryPrice - currentPriceInOriginalCurrency)) * trade.quantity;
      }

      const isProfit = pnl != null && pnl >= 0;

      const stopValue = trade.stopLoss ? Math.abs(trade.entryPrice - trade.stopLoss) * trade.quantity : null;
      const takeValue = trade.takeProfit ? Math.abs(trade.takeProfit - trade.entryPrice) * trade.quantity : null;

      return (
        <TableRow key={trade.id} onClick={() => handleRowClick(trade)} className={styles.clickableRow}>
          <TableCell>{trade.symbol.replace("USDT", "")}</TableCell>
          <TableCell>{`${trade.type} (${trade.marketType})`}</TableCell>
          <TableCell>{trade.quantity}</TableCell>
          <TableCell>{formatCurrency(trade.entryPrice, currencyCode, locale)}</TableCell>
          <TableCell>{formatCurrency(trade.exitPrice, currencyCode, locale)}</TableCell>
          <TableCell className={pnl !== null ? (isProfit ? styles.profit : styles.loss) : ''}>
            {formatTotalCurrency(pnl, currencyCode, locale)}
          </TableCell>
          <TableCell className={pnl !== null ? (isProfit ? styles.profit : styles.loss) : ''}>
            {calculatePnlPercent(trade, currentPriceInOriginalCurrency)}
          </TableCell>
          <TableCell className={styles.loss}>{formatTotalCurrency(stopValue, currencyCode, locale)}</TableCell>
          <TableCell className={styles.profit}>{formatTotalCurrency(takeValue, currencyCode, locale)}</TableCell>
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
          {activeTab === 'open' && (
            <TableCell>
              {trade.status === 'OPEN' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); handleCloseTrade(trade.id); }}
                  disabled={closeTradeMutation.isPending && closeTradeMutation.variables === trade.id}
                >
                  {closeTradeMutation.isPending && closeTradeMutation.variables === trade.id ? 'Fechando...' : 'Fechar'}
                </Button>
              )}
            </TableCell>
          )}
        </TableRow>
      );
    });
  };

  return (
    <Card>
      <CardHeader className={styles.cardHeader}>
        <CardTitle>Operações</CardTitle>
        <div className={styles.toggleButtons}>
          <Button
            variant={activeTab === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('open')}
            className={styles.toggleButton}
          >
            Abertas
          </Button>
          <Button
            variant={activeTab === 'closed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('closed')}
            className={styles.toggleButton}
          >
            Fechadas
          </Button>
        </div>
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
              <TableHead>Resultado</TableHead>
              <TableHead>Resultado (%)</TableHead>
              <TableHead>Stop (R$)</TableHead>
              <TableHead>Take (R$)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data/Hora</TableHead>
              {activeTab === 'open' && <TableHead>Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>
      </CardContent>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmar Fechamento"
      >
        <div className={styles.confirmModalContent}>
          <p>Tem certeza que deseja fechar esta operação pelo preço de mercado atual?</p>
          <div className={styles.confirmModalButtons}>
            <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmCloseTrade}
              disabled={closeTradeMutation.isPending}
            >
              {closeTradeMutation.isPending ? 'Fechando...' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>

      {isModalOpen && selectedTrade && (() => {
        const { currencyCode, locale } = getCurrencyDetails(selectedTrade);
        const isBuy = selectedTrade.type.toLowerCase() === 'compra' || selectedTrade.type.toLowerCase() === 'buy';

        const potentialLoss = (isBuy)
          ? (selectedTrade.stopLoss - selectedTrade.entryPrice) * selectedTrade.quantity
          : (selectedTrade.entryPrice - selectedTrade.stopLoss) * selectedTrade.quantity;

        const potentialProfit = (isBuy)
          ? (selectedTrade.takeProfit - selectedTrade.entryPrice) * selectedTrade.quantity
          : (selectedTrade.entryPrice - selectedTrade.takeProfit) * selectedTrade.quantity;

        return (
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detalhes da Operação">
            <div className={styles.modalContent}>
              <h4>Dados da Operação</h4>
              <div className={styles.modalGrid}>
                <div><strong>Ativo / Par:</strong> {selectedTrade.symbol}</div>
                <div><strong>Tipo:</strong> {selectedTrade.type} ({selectedTrade.marketType})</div>
                <div><strong>Preço de Entrada:</strong> {formatCurrency(selectedTrade.entryPrice, currencyCode, locale)}</div>
                <div><strong>Quantidade:</strong> {selectedTrade.quantity}</div>
                <div><strong>Custo Total ({currencyCode}):</strong> {formatCurrency(selectedTrade.entryPrice * selectedTrade.quantity, currencyCode, locale)}</div>
              </div>
              <h4>Gestão de Risco</h4>
              <div className={styles.modalGrid}>
                <div><strong>Perda Potencial ({currencyCode}):</strong> <span className={potentialLoss < 0 ? styles.loss : ''}>{formatCurrency(potentialLoss, currencyCode, locale)}</span></div>
                <div><strong>Lucro Potencial ({currencyCode}):</strong> <span className={potentialProfit > 0 ? styles.profit : ''}>{formatCurrency(potentialProfit, currencyCode, locale)}</span></div>
              </div>
              {selectedTrade.notes && (
                <>
                  <h4>Análise e Observações</h4>
                  <p>{selectedTrade.notes}</p>
                </>
              )}
            </div>
          </Modal>
        );
      })()}
    </Card>
  );
};