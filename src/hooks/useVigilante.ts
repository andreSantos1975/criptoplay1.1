
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
}

export const useVigilante = ({
  symbol,
  interval,
  openTrades,
  closeMutation,
  enabled = true,
}: VigilanteOptions) => {
  const [realtimeChartUpdate, setRealtimeChartUpdate] = useState<BarData | null>(null);
  const [closingTradeIds, setClosingTradeIds] = useState<string[]>([]);

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
    if (!realtimeChartUpdate || !openTrades || !enabled) {
      return;
    }

    const currentPrice = realtimeChartUpdate.close;

    for (const trade of openTrades) {
      if (closingTradeIds.includes(trade.id)) {
        continue;
      }

      if (trade.type === 'BUY') {
        let shouldClose = false;
        if (trade.stopLoss && currentPrice <= trade.stopLoss) {
          console.log(`VIGILANTE: Stop Loss atingido para ${trade.symbol}! Fechando...`);
          shouldClose = true;
        } else if (trade.takeProfit && currentPrice >= trade.takeProfit) {
          console.log(`VIGILANTE: Take Profit atingido para ${trade.symbol}! Fechando...`);
          shouldClose = true;
        }

        if (shouldClose) {
          setClosingTradeIds((prev) => [...prev, trade.id]);
          closeMutation.mutate(trade.id);
        }
      }
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeChartUpdate, openTrades, enabled, closeMutation]);
  
    // Reset closingTradeIds when a trade is successfully closed and removed from openTrades
    useEffect(() => {
        const openTradeIds = new Set(openTrades?.map(t => t.id) ?? []);
        setClosingTradeIds(prev => prev.filter(id => openTradeIds.has(id)));
    }, [openTrades]);


  return { realtimeChartUpdate };
};
