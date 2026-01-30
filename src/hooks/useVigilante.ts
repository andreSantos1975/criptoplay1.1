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
}: Omit<VigilanteOptions, 'closingPositionSymbols' | 'onAddToClosingPositionSymbols'>) => {
  // Ref local para controle síncrono, prevenindo o loop
  const closingSymbolsRef = useRef(new Set<string>());

  const openPositionsString = JSON.stringify(openPositions);
  const closeMutationRef = useRef(closeMutation);
  closeMutationRef.current = closeMutation;

  useEffect(() => {
    if (!enabled || !openPositions || openPositions.length === 0) {
      // Limpa a ref se não houver posições
      closingSymbolsRef.current.clear();
      return;
    }

    // Sincroniza a ref: remove símbolos que não estão mais nas posições abertas
    const openSymbols = new Set(openPositions.map(p => p.symbol));
    closingSymbolsRef.current.forEach(symbol => {
      if (!openSymbols.has(symbol)) {
        closingSymbolsRef.current.delete(symbol);
      }
    });

    const positionsBySymbol: { [key: string]: SimulatorPosition } = {};
    openPositions.forEach(pos => {
      positionsBySymbol[pos.symbol] = pos;
    });

    const symbols = Object.keys(positionsBySymbol);
    const sockets = new Map<string, WebSocket>();
    const reconnectTimeouts = new Map<string, NodeJS.Timeout>();

    const connect = (symbol: string) => {
      console.log(`[VIGILANTE-WS] Attempting to connect for ${symbol}...`);
      
      const position = positionsBySymbol[symbol];
      if (!position) return;

      const marketType = position.marketType || 'spot';
      const streamHost = marketType === 'futures' ? 'fstream.binance.com' : 'stream.binance.com:9443';
      const streamName = marketType === 'futures' ? `${symbol.toLowerCase()}@markPrice@1s` : `${symbol.toLowerCase()}@kline_1m`;
      
      const ws = new WebSocket(`wss://${streamHost}/ws/${streamName}`);

      ws.onopen = () => {
        console.log(`[VIGILANTE-WS] Connection opened for ${symbol}`);
        sockets.set(symbol, ws);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const currentPrice = marketType === 'futures' ? parseFloat(message.p) : parseFloat(message.k?.c);

        if (isNaN(currentPrice)) return;
        if (closeMutationRef.current.isPending) return;

        const pos = positionsBySymbol[symbol];
        if (!pos) return;

        // Se o símbolo já está sendo fechado, ignora
        if (closingSymbolsRef.current.has(pos.symbol)) return;

        const stopLoss = getNumericValue(pos.stopLoss);
        const takeProfit = getNumericValue(pos.takeProfit);

        if ((!stopLoss || stopLoss === 0) && (!takeProfit || takeProfit === 0)) return;

        if (checkTrigger(currentPrice, pos, stopLoss, takeProfit)) {
          console.log(`[VIGILANTE-WS] Closing ${pos.symbol} at ${currentPrice} (Mark Price)`);
          // Adiciona à ref local *antes* de chamar a mutação
          closingSymbolsRef.current.add(pos.symbol);
          closeMutationRef.current.mutate({ 
              symbol: pos.symbol, 
              price: currentPrice, 
              marketType: marketType 
          });
        }
      };

      ws.onerror = (error) => {
        console.warn(`[VIGILANTE-WS] Error for ${symbol}:`, error);
      };

      ws.onclose = () => {
        console.log(`[VIGILANTE-WS] Connection closed for ${symbol}. Reconnecting in 5 seconds...`);
        sockets.delete(symbol);
        if (reconnectTimeouts.has(symbol)) {
          clearTimeout(reconnectTimeouts.get(symbol)!);
        }
        const timeoutId = setTimeout(() => connect(symbol), 5000);
        reconnectTimeouts.set(symbol, timeoutId);
      };
    };

    symbols.forEach(symbol => connect(symbol));

    const pollingInterval = setInterval(async () => {
        for (const symbol of symbols) {
            if (closeMutationRef.current.isPending) continue;
            
            const pos = positionsBySymbol[symbol];
            // Se o símbolo já está sendo fechado, ignora
            if (!pos || closingSymbolsRef.current.has(pos.symbol)) continue;

            const stopLoss = getNumericValue(pos.stopLoss);
            const takeProfit = getNumericValue(pos.takeProfit);

            if ((!stopLoss || stopLoss === 0) && (!takeProfit || takeProfit === 0)) continue;
            
            const socket = sockets.get(symbol);
            if (socket && socket.readyState === WebSocket.OPEN) continue;

            const marketType = pos.marketType || 'spot';
            const apiPath = marketType === 'futures' ? 'futures-price' : 'price';

            try {
                const res = await fetch(`/api/binance/${apiPath}?symbol=${symbol}`);
                if (!res.ok) continue;
                const data = await res.json();
                const currentPrice = parseFloat(data.price);

                if (checkTrigger(currentPrice, pos, stopLoss, takeProfit)) {
                    console.log(`[VIGILANTE-POLL] Closing ${pos.symbol} at ${currentPrice}`);
                    // Adiciona à ref local *antes* de chamar a mutação
                    closingSymbolsRef.current.add(pos.symbol);
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
    }, 3000);

    return () => {
      console.log('[VIGILANTE-WS] Cleaning up all connections and timeouts.');
      reconnectTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      reconnectTimeouts.clear();
      
      sockets.forEach(ws => {
        ws.onclose = null; 
        ws.close();
      });
      sockets.clear();

      clearInterval(pollingInterval);
    };
  }, [openPositionsString, enabled]); // Removido onAddToClosingPositionSymbols das dependências
};
