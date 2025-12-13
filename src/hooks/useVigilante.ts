import { useState, useEffect } from 'react';
import { Trade } from '@prisma/client';
import { BarData } from 'lightweight-charts';
import { UseMutationResult } from '@tanstack/react-query';

interface VigilanteOptions {
  symbol: string;
  interval: string;
  marketType: 'spot' | 'futures';
  openTrades: Trade[] | undefined;
  closeMutation: UseMutationResult<Trade, Error, string, unknown>;
  enabled?: boolean;
  closingTradeIds: Set<string>;
  onAddToClosingTradeIds: (tradeId: string) => void;
}

const getNumericValue = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  if (value.toNumber && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

export const useVigilante = ({
  symbol,
  interval,
  marketType,
  openTrades,
  closeMutation,
  enabled = true,
  closingTradeIds,
  onAddToClosingTradeIds,
}: VigilanteOptions) => {
  const [realtimeChartUpdate, setRealtimeChartUpdate] = useState<BarData | null>(null);

  useEffect(() => {
    if (!symbol || !interval || !enabled) {
      setRealtimeChartUpdate(null);
      return;
    }
    
    const streamHost = marketType === 'futures'
      ? 'fstream.binance.com'
      : 'stream.binance.com:9443';
      
    const ws = new WebSocket(`wss://${streamHost}/ws/${symbol.toLowerCase()}@kline_${interval}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const kline = message.k;
      if (kline) {
        const candleUpdate: BarData = {
          time: (kline.t / 1000) as any,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        };
        setRealtimeChartUpdate(candleUpdate);

        if (closeMutation.isPending || !openTrades) return;

        const currentPrice = candleUpdate.close;

        for (const trade of openTrades) {
          if (trade.symbol !== symbol) {
            continue;
          }

          if (closingTradeIds.has(trade.id)) {
            continue;
          }
          
          const stopLoss = getNumericValue(trade.stopLoss);
          const takeProfit = getNumericValue(trade.takeProfit);

          if (stopLoss === null && takeProfit === null) {
            continue;
          }

          const tradeType = trade.type.toLowerCase();
          const isBuyTrade = tradeType === 'compra' || tradeType === 'buy' || tradeType === 'long';

          let shouldClose = false;
          if (isBuyTrade) {
            if (stopLoss && currentPrice <= stopLoss) shouldClose = true;
            else if (takeProfit && currentPrice >= takeProfit) shouldClose = true;
          } else { // Sell trade
            if (stopLoss && currentPrice >= stopLoss) shouldClose = true;
            else if (takeProfit && currentPrice <= takeProfit) shouldClose = true;
          }

          if (shouldClose) {
            onAddToClosingTradeIds(trade.id);
            closeMutation.mutate(trade.id);
            break;
          }
        }
      }
    };

    ws.onerror = (error) => {
      console.error("[VIGILANTE] WebSocket Error:", error);
    };

    return () => {
      ws.close();
    };
  }, [symbol, interval, marketType, enabled, closeMutation, closingTradeIds, onAddToClosingTradeIds, openTrades]);

  return { realtimeChartUpdate };
};
