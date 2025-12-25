import { useEffect, useRef } from 'react';

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

export interface VigilanteClosePayload {
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

// Helper function to check if price triggers SL or TP
const checkTrigger = (
  currentPrice: number, 
  pos: SimulatorPosition, 
  stopLoss: number | null, 
  takeProfit: number | null
): boolean => {
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

    return shouldClose;
};

// This hook is now a "Global Vigilante" for POSITIONS. 
// It watches all open positions and closes them if their aggregated SL/TP is met.
// Uses WebSocket for real-time updates AND Polling as a fallback for stability.
export const useVigilante = ({
  openPositions,
  closeMutation,
  enabled = true,
  closingPositionSymbols,
  onAddToClosingPositionSymbols,
}: VigilanteOptions) => {
  const openPositionsString = JSON.stringify(openPositions);
  
  // Refs to keep track of state inside intervals/callbacks without staleness
  const closingSymbolsRef = useRef(closingPositionSymbols);
  closingSymbolsRef.current = closingPositionSymbols;

  const closeMutationRef = useRef(closeMutation);
  closeMutationRef.current = closeMutation;

  useEffect(() => {
    if (!enabled || !openPositions || openPositions.length === 0) {
      return;
    }

    // Map positions by symbol for easy lookup
    const positionsBySymbol: { [key: string]: SimulatorPosition } = {};
    openPositions.forEach(pos => {
      positionsBySymbol[pos.symbol] = pos;
    });

    const symbols = Object.keys(positionsBySymbol);
    const sockets: WebSocket[] = [];

    // --- STRATEGY 1: WEBSOCKET (Fast, Real-time) ---
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

          if (closeMutationRef.current.isPending) return;

          const pos = positionsBySymbol[symbol];
          if (!pos) return;

          if (closingSymbolsRef.current.has(pos.symbol)) return;

          const stopLoss = getNumericValue(pos.stopLoss);
          const takeProfit = getNumericValue(pos.takeProfit);

          if ((!stopLoss || stopLoss === 0) && (!takeProfit || takeProfit === 0)) return;

          if (checkTrigger(currentPrice, pos, stopLoss, takeProfit)) {
            console.log(`[VIGILANTE-WS] Closing ${pos.symbol} at ${currentPrice}`);
            onAddToClosingPositionSymbols(pos.symbol);
            closeMutationRef.current.mutate({ 
                symbol: pos.symbol, 
                price: currentPrice, 
                marketType: marketType 
            });
          }
        }
      };

      ws.onerror = (error) => {
        // Just log, the Polling strategy will pick it up
        console.warn(`[VIGILANTE-WS] Error for ${symbol}. Polling will handle updates.`);
      };

      sockets.push(ws);
    });

    // --- STRATEGY 2: POLLING (Robust, Fallback) ---
    // Runs every 3 seconds to fetch prices via API Proxy (Server-side)
    // This bypasses client-side WebSocket blocks (CORS, ISP, etc.)
    const pollingInterval = setInterval(async () => {
        for (const symbol of symbols) {
            if (closeMutationRef.current.isPending) continue;
            
            const pos = positionsBySymbol[symbol];
            if (!pos) continue;
            if (closingSymbolsRef.current.has(pos.symbol)) continue;

            const stopLoss = getNumericValue(pos.stopLoss);
            const takeProfit = getNumericValue(pos.takeProfit);

            if ((!stopLoss || stopLoss === 0) && (!takeProfit || takeProfit === 0)) continue;

            const marketType = pos.marketType || 'spot';
            const apiPath = marketType === 'futures' ? 'futures-price' : 'price';

            try {
                const res = await fetch(`/api/binance/${apiPath}?symbol=${symbol}`);
                if (!res.ok) continue;
                const data = await res.json();
                const currentPrice = parseFloat(data.price);

                if (checkTrigger(currentPrice, pos, stopLoss, takeProfit)) {
                    console.log(`[VIGILANTE-POLL] Closing ${pos.symbol} at ${currentPrice}`);
                    onAddToClosingPositionSymbols(pos.symbol);
                    closeMutationRef.current.mutate({ 
                        symbol: pos.symbol, 
                        price: currentPrice, 
                        marketType: marketType 
                    });
                }
            } catch (err) {
                console.error(`[VIGILANTE-POLL] Error fetching price for ${symbol}:`, err);
            }
        }
    }, 3000); // Check every 3 seconds

    return () => {
      sockets.forEach(ws => ws.close());
      clearInterval(pollingInterval);
    };
  // Re-run if positions change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPositionsString, enabled, onAddToClosingPositionSymbols]);
};
