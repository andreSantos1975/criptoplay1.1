import { useEffect } from 'react';
import { Trade } from '@prisma/client';
import { UseMutationResult } from '@tanstack/react-query';

interface VigilanteOptions {
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

// This hook is now a "Global Vigilante". It watches all open trades
// and closes them if their SL/TP is met. It does not return any UI data.
export const useVigilante = ({
  openTrades,
  closeMutation,
  enabled = true,
  closingTradeIds,
  onAddToClosingTradeIds,
}: VigilanteOptions) => {
  useEffect(() => {
    if (!enabled || !openTrades || openTrades.length === 0) {
      return;
    }

    const tradesBySymbol: { [key: string]: Trade[] } = {};
    openTrades.forEach(trade => {
      if (!tradesBySymbol[trade.symbol]) {
        tradesBySymbol[trade.symbol] = [];
      }
      tradesBySymbol[trade.symbol].push(trade);
    });

    const symbols = Object.keys(tradesBySymbol);
    const sockets: WebSocket[] = [];
    const priceState: { [key: string]: number } = {};

    symbols.forEach(symbol => {
      // Assuming all trades for a symbol have the same marketType.
      // This is a reasonable assumption for this app's structure.
      const marketType = tradesBySymbol[symbol][0].marketType || 'spot'; 
      
      const streamHost = marketType === 'futures'
        ? 'fstream.binance.com'
        : 'stream.binance.com:9443';
        
      const ws = new WebSocket(`wss://${streamHost}/ws/${symbol.toLowerCase()}@kline_1m`);

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const kline = message.k;

        if (kline) {
          const currentPrice = parseFloat(kline.c);
          priceState[symbol] = currentPrice;

          if (closeMutation.isPending) return;

          const tradesForSymbol = tradesBySymbol[symbol] || [];

          for (const trade of tradesForSymbol) {
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
            } else { // Sell/Short trade
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
        console.error(`[GLOBAL_VIGILANTE] WebSocket Error for ${symbol}:`, error);
      };

      sockets.push(ws);
    });

    return () => {
      sockets.forEach(ws => ws.close());
    };
  // IMPORTANT: We reduce dependency changes to avoid re-running this complex effect
  // unnecessarily. We only need to re-run if the list of open trades *structurally* changes.
  // A simple JSON.stringify is a pragmatic way to check for changes in the trades list.
  }, [JSON.stringify(openTrades), enabled, closeMutation, closingTradeIds, onAddToClosingTradeIds]);

  // This hook no longer returns anything as it's a background process
};
