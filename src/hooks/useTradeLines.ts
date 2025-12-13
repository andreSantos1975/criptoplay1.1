import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IChartApi, ISeriesApi, IPriceLine, LineStyle, CandlestickSeries } from 'lightweight-charts';
import { Trade } from '@prisma/client'; // Assuming Trade type is available globally or imported

type PriceLineKey = 'entry' | 'takeProfit' | 'stopLoss';

interface UseTradeLinesProps {
  chartRef: React.RefObject<IChartApi | null>;
  seriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
  chartContainerRef: React.RefObject<HTMLDivElement>;
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number }; // Prospective trade levels
  onLevelsChange: (levels: { entry: number; takeProfit: number; stopLoss: number }) => void;
  isChartReady: boolean;
  marketType: 'spot' | 'futures';
  tipoOperacao: 'compra' | 'venda' | '';
  openTrades: Trade[] | undefined; // Active open trades
  symbol: string; // <-- ADDED
}

// Helper function to create line options
const createLineOptions = (price: number, color: string, title: string, isDashed: boolean = false) => ({
  price,
  color,
  lineWidth: 2 as any,
  lineStyle: isDashed ? LineStyle.Dashed : LineStyle.Solid,
  axisLabelVisible: true,
  title,
});

export const useTradeLines = ({
  chartRef,
  seriesRef,
  chartContainerRef,
  tradeLevels, // Prospective
  onLevelsChange,
  isChartReady,
  marketType,
  tipoOperacao,
  openTrades, // Active
  symbol, // <-- ADDED
}: UseTradeLinesProps) => {
  // Refs for prospective trade lines (draggable)
  const prospectivePriceLinesRef = useRef<Partial<Record<PriceLineKey, IPriceLine>>>({});
  const [draggingLine, setDraggingLine] = useState<PriceLineKey | null>(null);

  // Map to store active trade lines (static)
  // Map<trade.id, { entryLine, tpLine, slLine }>
  const activeTradeLinesRef = useRef<Map<string, { [key: string]: IPriceLine }>>(new Map());

  // Refs to hold the latest props for use in callbacks without causing re-renders
  const onLevelsChangeRef = useRef(onLevelsChange);
  onLevelsChangeRef.current = onLevelsChange;
  const tradeLevelsRef = useRef(tradeLevels);
  tradeLevelsRef.current = tradeLevels;

  // Function to remove all active trade lines
  const removeAllActiveTradeLines = useCallback(() => {
    const series = seriesRef.current;
    if (series) {
      activeTradeLinesRef.current.forEach(tradeLineSet => {
        Object.values(tradeLineSet).forEach(line => series.removePriceLine(line));
      });
      activeTradeLinesRef.current.clear();
    }
  }, [seriesRef]); // Added seriesRef to dependencies

  // Effect to manage active trade lines (static)
  useEffect(() => {
    const series = seriesRef.current;
    if (!isChartReady || !series) {
      // Clean up all active lines if chart is not ready or series is null
      removeAllActiveTradeLines();
      return;
    }

    const currentActiveTradeIds = new Set<string>();
    openTrades?.forEach(trade => {
      // Check if the trade's symbol matches the current chart symbol
      if (trade.symbol === symbol) { // Basic symbol check
        currentActiveTradeIds.add(trade.id);

        const tradeLineSet = activeTradeLinesRef.current.get(trade.id) || {};

        // Entry Line
        const entryPrice = parseFloat(trade.entryPrice as any);
        if (entryPrice > 0) {
          if (!tradeLineSet.entryLine) {
            tradeLineSet.entryLine = series.createPriceLine(createLineOptions(entryPrice, '#4CAF50', `Entrada (${trade.id.substring(0, 4)})`, false)); // Green
          } else {
            tradeLineSet.entryLine.applyOptions(createLineOptions(entryPrice, '#4CAF50', `Entrada (${trade.id.substring(0, 4)})`, false));
          }
        } else if (tradeLineSet.entryLine) {
          series.removePriceLine(tradeLineSet.entryLine);
          delete tradeLineSet.entryLine;
        }

        // Take Profit Line
        const takeProfitPrice = trade.takeProfit ? parseFloat(trade.takeProfit as any) : null;
        if (takeProfitPrice && takeProfitPrice > 0) {
          if (!tradeLineSet.tpLine) {
            tradeLineSet.tpLine = series.createPriceLine(createLineOptions(takeProfitPrice, '#00C853', `TP (${trade.id.substring(0, 4)})`, true)); // Light Green
          } else {
            tradeLineSet.tpLine.applyOptions(createLineOptions(takeProfitPrice, '#00C853', `TP (${trade.id.substring(0, 4)})`, true));
          }
        } else if (tradeLineSet.tpLine) {
          series.removePriceLine(tradeLineSet.tpLine);
          delete tradeLineSet.tpLine;
        }

        // Stop Loss Line
        const stopLossPrice = trade.stopLoss ? parseFloat(trade.stopLoss as any) : null;
        if (stopLossPrice && stopLossPrice > 0) {
          if (!tradeLineSet.slLine) {
            tradeLineSet.slLine = series.createPriceLine(createLineOptions(stopLossPrice, '#D32F2F', `SL (${trade.id.substring(0, 4)})`, true)); // Red
          } else {
            tradeLineSet.slLine.applyOptions(createLineOptions(stopLossPrice, '#D32F2F', `SL (${trade.id.substring(0, 4)})`, true));
          }
        } else if (tradeLineSet.slLine) {
          series.removePriceLine(tradeLineSet.slLine);
          delete tradeLineSet.slLine;
        }

        activeTradeLinesRef.current.set(trade.id, tradeLineSet);
      }
    });

    // Remove lines for trades that are no longer open
    activeTradeLinesRef.current.forEach((_, tradeId) => {
      if (!currentActiveTradeIds.has(tradeId)) {
        const tradeLineSet = activeTradeLinesRef.current.get(tradeId);
        if (tradeLineSet) {
          Object.values(tradeLineSet).forEach(line => series.removePriceLine(line));
        }
        activeTradeLinesRef.current.delete(tradeId);
      }
    });

    return () => {
      // Cleanup on unmount or when dependencies change significantly
      if (!series) { // Use the captured series variable
        removeAllActiveTradeLines();
      }
    };
  }, [isChartReady, openTrades, removeAllActiveTradeLines, symbol, seriesRef]);

  // Effect to setup drag-and-drop listeners for PROSPECTIVE lines
  useEffect(() => {
    const chartElement = chartContainerRef.current;
    const chart = chartRef.current;
    const series = seriesRef.current;

    if (!isChartReady || !chartElement || !chart || !series) return;

    let currentDraggingLine: PriceLineKey | null = null;

    const isNearPriceLine = (priceLine: IPriceLine, y: number) => {
      const priceY = series.priceToCoordinate(priceLine.options().price);
      return priceY !== null && Math.abs(priceY - y) < 10; // 10px tolerance
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = chartElement.getBoundingClientRect();
      const y = e.clientY - rect.top;

      for (const key of ['takeProfit', 'stopLoss'] as PriceLineKey[]) { // Only TP and SL for prospective
        const priceLine = prospectivePriceLinesRef.current[key];
        if (priceLine && isNearPriceLine(priceLine, y)) {
          currentDraggingLine = key;
          chart.applyOptions({ handleScroll: false, handleScale: false });
          chartElement.style.cursor = 'ns-resize';
          return;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!currentDraggingLine) return;

      const rect = chartElement.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const newPrice = series.coordinateToPrice(y);

      if (newPrice !== null) {
        onLevelsChangeRef.current({
          ...tradeLevelsRef.current,
          [currentDraggingLine]: newPrice,
        });
      }
    };

    const handleMouseUp = () => {
      if (!currentDraggingLine) return;

      currentDraggingLine = null;
      chart.applyOptions({ handleScroll: true, handleScale: true });
      chartElement.style.cursor = 'default';
    };

    chartElement.addEventListener('mousedown', handleMouseDown);
    chartElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      chartElement.removeEventListener('mousedown', handleMouseDown);
      chartElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isChartReady, chartRef, seriesRef, chartContainerRef]);

  // Effect to update or create PROSPECTIVE price lines
  useEffect(() => {
    const series = seriesRef.current;
    if (!isChartReady || !series) return;

    // A function to create or update a line
    const updateOrCreateProspectivePriceLine = (key: PriceLineKey, price: number, color: string, title: string) => {
      const existingLine = prospectivePriceLinesRef.current[key];
      if (price > 0) {
        const lineOptions = createLineOptions(price, color, title, key !== "entry"); // Entry is solid, others dashed
        if (existingLine) {
          existingLine.applyOptions(lineOptions);
        } else {
          prospectivePriceLinesRef.current[key] = series.createPriceLine(lineOptions);
        }
      } else if (existingLine) {
        series.removePriceLine(existingLine);
        delete prospectivePriceLinesRef.current[key];
      }
    };
    
    // Always create prospective entry line if tradeLevels.entry is set
    updateOrCreateProspectivePriceLine("entry", tradeLevels.entry, "#42A5F5", "Entrada Prev."); // Blue

    // Conditionally create prospective TP and SL lines
    if (marketType === 'futures' || (marketType === 'spot' && (tipoOperacao === 'compra' || tipoOperacao === 'venda'))) {
      updateOrCreateProspectivePriceLine("takeProfit", tradeLevels.takeProfit, "#66BB6A", "TP Prev."); // Light Green
    } else {
        // If conditions are not met, remove them
        updateOrCreateProspectivePriceLine("takeProfit", 0, "", "");
    }
    // Always ensure Stop Loss is handled explicitly to avoid issues when changing operation type
    if (marketType === 'futures' || (marketType === 'spot' && (tipoOperacao === 'compra' || tipoOperacao === 'venda'))) {
        updateOrCreateProspectivePriceLine("stopLoss", tradeLevels.stopLoss, "#FF7043", "SL Prev."); // Light Red
    } else {
        updateOrCreateProspectivePriceLine("stopLoss", 0, "", "");
    }
  }, [isChartReady, tradeLevels, tipoOperacao, marketType, seriesRef]);

  // Cleanup for prospective lines on unmount
  useEffect(() => {
    const series = seriesRef.current;
    return () => {
      if (series) {
        Object.values(prospectivePriceLinesRef.current).forEach(line => series.removePriceLine(line));
        prospectivePriceLinesRef.current = {};
      }
    };
  }, [seriesRef]);
};