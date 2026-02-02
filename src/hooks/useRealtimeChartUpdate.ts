import { useState, useEffect } from 'react';
import { BarData } from 'lightweight-charts';

interface RealtimeChartUpdateOptions {
  symbol: string;
  interval: string;
  marketType: 'spot' | 'futures';
  enabled?: boolean;
}

/// This hook is a "light" version of the old Vigilante. Its only job is to
// connect to a single WebSocket stream and provide real-time price updates
/// for the UI (e.g., the chart). It has no trading logic.
export const useRealtimeChartUpdate = ({
  symbol,
  interval,
  marketType,
  enabled = true,
}: RealtimeChartUpdateOptions) => {
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
          time: Math.floor(kline.t / 1000) as any,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
        };
        setRealtimeChartUpdate(candleUpdate);
      }
    };

    ws.onerror = (error) => {
      console.error(`[RealtimeChartUpdate] WebSocket Error for ${symbol}:`, error);
    };

    return () => {
      ws.close();
    };
  }, [symbol, interval, marketType, enabled]);

  return { realtimeChartUpdate };
};
