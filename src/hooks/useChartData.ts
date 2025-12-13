import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarData } from 'lightweight-charts';
import { useVigilante } from './useVigilante'; // Assuming useVigilante is in the same hooks folder
import { Trade } from "@prisma/client";

// Define the structure of the raw API response for a Kline
type BinanceKline = [ number, string, string, string, string, string, number, string, number, string, string, string ];

// Helper function to parse raw Kline data into BarData format
const parseKlineData = (data: BinanceKline[]): BarData[] => {
  if (!data || !Array.isArray(data)) return [];
  return data.map(k => ({
    time: (k[0] / 1000) as any,
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
  }));
};

// The main custom hook
export const useChartData = (
  symbol: string,
  marketType: 'spot' | 'futures',
  interval: string,
  closeMutation: any, // Pass the mutation object from the parent
  openTrades: Trade[] | undefined,
  closingTradeIds: Set<string>,
  onAddToClosingTradeIds: (tradeId: string) => void
) => {
  const [headerData, setHeaderData] = useState<BarData>({ open: 0, high: 0, low: 0, close: 0, time: 0 as any });
  
  const isQueryEnabled = !(marketType === 'futures' && symbol.endsWith('BRL'));

  // 1. Fetch historical data for the main chart based on the selected interval
  const { data: chartSeriesData, isLoading: isChartLoading } = useQuery({
    queryKey: ['binanceKlines', marketType, interval, symbol],
    queryFn: async () => {
      const apiPath = marketType === 'futures' ? 'futures-klines' : 'klines';
      const response = await fetch(`/api/binance/${apiPath}?symbol=${symbol}&interval=${interval}`);
      if (!response.ok) throw new Error(`Failed to fetch ${interval} klines`);
      const rawData = await response.json() as BinanceKline[];
      return parseKlineData(rawData);
    },
    enabled: isQueryEnabled,
    staleTime: 1000 * 60, // 1 minute
  });

  // 2. Fetch daily historical data specifically for the header summary
  const { data: dailySummaryData } = useQuery({
    queryKey: ['binanceKlines', marketType, '1d', symbol],
    queryFn: async () => {
      const apiPath = marketType === 'futures' ? 'futures-klines' : 'klines';
      const response = await fetch(`/api/binance/${apiPath}?symbol=${symbol}&interval=1d`);
      if (!response.ok) throw new Error('Failed to fetch daily klines for summary');
      const rawData = await response.json() as BinanceKline[];
      return parseKlineData(rawData);
    },
    enabled: isQueryEnabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 3. Get real-time updates from the Vigilante hook
  const { realtimeChartUpdate } = useVigilante({
    symbol,
    interval: '1m', // Vigilante always uses 1m for real-time ticks
    marketType,
    closeMutation,
    openTrades,
    enabled: isQueryEnabled, // Enable vigilante when queries are enabled
    closingTradeIds,
    onAddToClosingTradeIds,
  });

  // 4. Combine data sources to manage the headerData state
  // Effect to set the base header data from the daily summary
  useEffect(() => {
    if (dailySummaryData && dailySummaryData.length > 0) {
      const statsCandle = dailySummaryData.length > 1
        ? dailySummaryData[dailySummaryData.length - 2]
        : dailySummaryData[dailySummaryData.length - 1];
      setHeaderData(statsCandle);
    }
  }, [dailySummaryData]);

  // Effect to update the header with real-time price
  useEffect(() => {
    if (realtimeChartUpdate) {
      setHeaderData(prevData => ({
        ...prevData,
        close: realtimeChartUpdate.close,
      }));
    }
  }, [realtimeChartUpdate]);

  // 5. Return the clean, processed data for the UI component
  return {
    isChartLoading,
    chartSeriesData,
    headerData,
    realtimeChartUpdate,
  };
};
