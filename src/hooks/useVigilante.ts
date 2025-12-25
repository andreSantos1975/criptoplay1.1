import { useEffect } from 'react';
import { UseMutationResult } from '@tanstack/react-query';

// Definition based on the aggregated object from /api/simulator/profile
export interface SimulatorPosition {
  symbol: string;
  totalQuantity: number;
  averageEntryPrice: number;
  stopLoss: number;
  takeProfit: number;
  tradeIds: string[];
  marketType?: 'spot' | 'futures'; // Optional, defaulting to 'spot' if missing
}

interface VigilanteClosePayload {
  symbol: string;
  price: number;
  marketType: 'spot' | 'futures';
}

interface VigilanteOptions {
  openPositions: SimulatorPosition[] | undefined;
  // Relaxing the type to accept a mutation-like object that handles our payload
  closeMutation: {
    mutate: (payload: VigilanteClosePayload) => void;
    isPending: boolean;
  };
  enabled?: boolean;
  closingPositionSymbols: Set<string>;
  onAddToClosingPositionSymbols: (symbol: string) => void;
}

const getNumericValue = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  // Handle Decimal-like objects if they leak here
  if (value && typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

// This hook is now a "Global Vigilante" for POSITIONS. 
// It watches all open positions and closes them if their aggregated SL/TP is met.
export const useVigilante = ({
  openPositions,
  closeMutation,
  enabled = true,
  closingPositionSymbols,
  onAddToClosingPositionSymbols,
}: VigilanteOptions) => {
  const openPositionsString = JSON.stringify(openPositions);

  useEffect(() => {
    if (!enabled || !openPositions || openPositions.length === 0) {
      return;
    }

    // Map positions by symbol for easy lookup inside WebSocket callback
    const positionsBySymbol: { [key: string]: SimulatorPosition } = {};
    openPositions.forEach(pos => {
      positionsBySymbol[pos.symbol] = pos;
    });

    const symbols = Object.keys(positionsBySymbol);
    const sockets: WebSocket[] = [];

    symbols.forEach(symbol => {
      const position = positionsBySymbol[symbol];
      const marketType = position.marketType || 'spot';

      const streamHost = marketType === 'futures'
        ? 'fstream.binance.com'
        : 'stream.binance.com:9443';
        
      const ws = new WebSocket(`wss://${streamHost}/ws/${symbol.toLowerCase()}@kline_1m`);

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const kline = message.k;

        if (kline) {
          const currentPrice = parseFloat(kline.c);

          if (closeMutation.isPending) return;

          // Check the specific position for this symbol
          const pos = positionsBySymbol[symbol];
          
          if (!pos) return;

          if (closingPositionSymbols.has(pos.symbol)) {
            return;
          }

          const stopLoss = getNumericValue(pos.stopLoss);
          const takeProfit = getNumericValue(pos.takeProfit);

          // If neither is set, nothing to do
          if ((!stopLoss || stopLoss === 0) && (!takeProfit || takeProfit === 0)) {
            return;
          }

          let shouldClose = false;

          // STOP LOSS CHECK
          if (stopLoss && stopLoss > 0) {
             if (stopLoss < pos.averageEntryPrice) {
                 // Long SL logic
                 if (currentPrice <= stopLoss) shouldClose = true;
             } else {
                 // Short SL logic
                 if (currentPrice >= stopLoss) shouldClose = true;
             }
          }

          // TAKE PROFIT CHECK
          if (!shouldClose && takeProfit && takeProfit > 0) {
              if (takeProfit > pos.averageEntryPrice) {
                  // Long TP logic
                  if (currentPrice >= takeProfit) shouldClose = true;
              } else {
                  // Short TP logic
                  if (currentPrice <= takeProfit) shouldClose = true;
              }
          }

          if (shouldClose) {
            console.log(`[VIGILANTE] Closing position ${pos.symbol} at ${currentPrice} (SL: ${stopLoss}, TP: ${takeProfit})`);
            onAddToClosingPositionSymbols(pos.symbol);
            closeMutation.mutate({ 
                symbol: pos.symbol, 
                price: currentPrice, 
                marketType: marketType 
            });
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
  // Re-run if the structure of positions (symbols or SL/TP values) changes substantially
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPositionsString, enabled, closeMutation, closingPositionSymbols, onAddToClosingPositionSymbols]);
};