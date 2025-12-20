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

interface VigilanteOptions {
  openPositions: SimulatorPosition[] | undefined;
  closeMutation: UseMutationResult<any, Error, string, unknown>; // Mutation expects symbol (string)
  enabled?: boolean;
  closingPositionSymbols: Set<string>;
  onAddToClosingPositionSymbols: (symbol: string) => void;
}

const getNumericValue = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value);
  // Handle Decimal-like objects if they leak here, though the API returns numbers
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
      // Assuming marketType might be available in position, or default to spot.
      // The current API might not be passing marketType explicitly in the aggregated object,
      // but usually the symbol implies it or we can check the first trade.
      // For now, let's assume 'spot' or check if we can infer it. 
      // Ideally, the backend should provide marketType on the position.
      // If not available, we default to standard Binance stream which covers spot.
      // If futures are needed, the position object needs to carry that info.
      
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

          // Determine direction based on logic (Long vs Short)
          // Since we don't have explicit 'SIDE' (Buy/Sell) on the Position object from the API response seen earlier,
          // we usually assume 'LONG' for Spot. 
          // If the system supports Shorting (Futures), the position object needs to indicate direction.
          // However, based on typical simple spot simulators:
          // Long: Stop Loss < Entry, Take Profit > Entry.
          
          // Heuristic:
          // If Stop Loss < Average Entry -> Likely LONG
          // If Stop Loss > Average Entry -> Likely SHORT
          
          // But a safer bet for now (as per previous logic):
          // Buy (Long): Close if price <= SL or price >= TP
          // Sell (Short): Close if price >= SL or price <= TP
          
          // We can try to infer side from SL/TP relative to Entry if not provided.
          // Or simply check:
          // If SL is defined and Price hits it.
          // If TP is defined and Price hits it.
          
          // Let's refine the logic.
          // If SL < EntryPrice, it's a Long SL (trigger if Price <= SL)
          // If SL > EntryPrice, it's a Short SL (trigger if Price >= SL)
          
          // Similarly for TP:
          // If TP > EntryPrice, it's a Long TP (trigger if Price >= TP)
          // If TP < EntryPrice, it's a Short TP (trigger if Price <= TP)
          
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
            closeMutation.mutate(pos.symbol);
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
  }, [JSON.stringify(openPositions), enabled, closeMutation, closingPositionSymbols, onAddToClosingPositionSymbols]);
};