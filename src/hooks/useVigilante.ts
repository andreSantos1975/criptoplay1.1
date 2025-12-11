import { useState, useEffect } from 'react';
import { Trade } from '@prisma/client';
import { BarData } from 'lightweight-charts';
import { UseMutationResult } from '@tanstack/react-query';

interface VigilanteOptions {
  symbol: string;
  interval: string;
  openTrades: Trade[] | undefined;
  closeMutation: UseMutationResult<Trade, Error, string, unknown>;
  enabled?: boolean;
  closingTradeIds: Set<string>; // Estado elevado
  onAddToClosingTradeIds: (tradeId: string) => void; // Callback para atualizar estado elevado
}

export const useVigilante = ({
  symbol,
  interval,
  openTrades,
  closeMutation,
  enabled = true,
  closingTradeIds,
  onAddToClosingTradeIds,
}: VigilanteOptions) => {
  const [realtimeChartUpdate, setRealtimeChartUpdate] = useState<BarData | null>(null);

  // Effect for WebSocket connection
  useEffect(() => {
    if (!symbol || !interval || !enabled) {
      setRealtimeChartUpdate(null);
      return;
    }

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const kline = message.k;
      if (kline) {
        const candleUpdate: BarData = {
          time: kline.t / 1000,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        };
        setRealtimeChartUpdate(candleUpdate);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    return () => {
      ws.close();
    };
  }, [symbol, interval, enabled]);

  // VIGILANTE: Checks for SL/TP hits on every price update
  useEffect(() => {
    // A lógica de log foi removida para esta correção final.
    if (closeMutation.isPending) {
      return;
    }

    if (!realtimeChartUpdate || !openTrades || !enabled) {
      return;
    }

    const currentPrice = realtimeChartUpdate.close;

    for (const trade of openTrades) {
      if (trade.symbol !== symbol) {
        continue;
      }

      // Usa o estado elevado para a verificação
      if (closingTradeIds.has(trade.id)) {
        continue;
      }
      
      const stopLoss = trade.stopLoss ? parseFloat(trade.stopLoss as any) : null;
      const takeProfit = trade.takeProfit ? parseFloat(trade.takeProfit as any) : null;

      const tradeType = trade.type.toLowerCase();
      const isBuyTrade = tradeType === 'compra' || tradeType === 'buy' || tradeType === 'long';
      const isSellTrade = tradeType === 'venda' || tradeType === 'sell' || tradeType === 'short';

      let shouldClose = false;

      if (isBuyTrade) {
        if (stopLoss && currentPrice <= stopLoss) {
          shouldClose = true;
        } else if (takeProfit && currentPrice >= takeProfit) {
          shouldClose = true;
        }
      } else if (isSellTrade) {
        if (stopLoss && currentPrice >= stopLoss) {
          shouldClose = true;
        } else if (takeProfit && currentPrice <= takeProfit) {
          shouldClose = true;
        }
      }

      if (shouldClose) {
        onAddToClosingTradeIds(trade.id); // Chama o callback para atualizar o estado no pai
        closeMutation.mutate(trade.id);
        break;
      }
    }
  }, [realtimeChartUpdate, openTrades, enabled, closeMutation, symbol, closingTradeIds, onAddToClosingTradeIds]);
  
  // O useEffect de limpeza foi removido e será movido para o componente pai.

  return { realtimeChartUpdate };
};
