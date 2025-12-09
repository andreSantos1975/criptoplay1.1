import React, { useEffect, useRef, useState } from 'react';
import { IChartApi, ISeriesApi, IPriceLine, LineStyle, CandlestickSeries } from 'lightweight-charts';

type PriceLineKey = 'entry' | 'takeProfit' | 'stopLoss';

interface UseTradeLinesProps {
  chartRef: React.RefObject<IChartApi | null>;
  seriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
  chartContainerRef: React.RefObject<HTMLDivElement>;
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number };
  onLevelsChange: (levels: { entry: number; takeProfit: number; stopLoss: number }) => void;
  isChartReady: boolean;
  marketType: 'spot' | 'futures';
  tipoOperacao: 'compra' | 'venda' | '';
}

export const useTradeLines = ({
  chartRef,
  seriesRef,
  chartContainerRef,
  tradeLevels,
  onLevelsChange,
  isChartReady,
  marketType,
  tipoOperacao,
}: UseTradeLinesProps) => {
  const priceLinesRef = useRef<Partial<Record<PriceLineKey, IPriceLine>>>({});
  const [draggingLine, setDraggingLine] = useState<PriceLineKey | null>(null);

  // Refs to hold the latest props for use in callbacks without causing re-renders
  const onLevelsChangeRef = useRef(onLevelsChange);
  onLevelsChangeRef.current = onLevelsChange;
  const tradeLevelsRef = useRef(tradeLevels);
  tradeLevelsRef.current = tradeLevels;

  // Effect to setup drag-and-drop listeners
  useEffect(() => {
    const chartElement = chartContainerRef.current;
    const chart = chartRef.current;
    const series = seriesRef.current;

    if (!isChartReady || !chartElement || !chart || !series) return;

    const isNearPriceLine = (price: number, y: number) => {
      const priceY = series.priceToCoordinate(price);
      return priceY !== null && Math.abs(priceY - y) < 10; // 10px tolerance
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = chartElement.getBoundingClientRect();
      const y = e.clientY - rect.top;

      for (const key in priceLinesRef.current) {
        // Entry line is not draggable
        if (key === 'entry') continue;

        const priceLine = priceLinesRef.current[key as PriceLineKey];
        if (priceLine && isNearPriceLine(priceLine.options().price, y)) {
          setDraggingLine(key as PriceLineKey);
          chart.applyOptions({ handleScroll: false, handleScale: false });
          chartElement.style.cursor = 'ns-resize';
          return;
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingLine) return;

      const rect = chartElement.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const newPrice = series.coordinateToPrice(y);

      if (newPrice !== null) {
        onLevelsChangeRef.current({
          ...tradeLevelsRef.current,
          [draggingLine]: newPrice,
        });
      }
    };

    const handleMouseUp = () => {
      setDraggingLine(null);
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
  }, [isChartReady, draggingLine, chartRef, seriesRef, chartContainerRef]);

  // Effect to update or create price lines
  useEffect(() => {
    const series = seriesRef.current;
    if (!isChartReady || !series || !tradeLevels) return;

    // A function to create or update a line
    const updateOrCreatePriceLine = (key: PriceLineKey, price: number, color: string, title: string) => {
      const existingLine = priceLinesRef.current[key];
      if (price > 0) {
        const lineOptions = { price, color, lineWidth: 2, lineStyle: key === "entry" ? LineStyle.Solid : LineStyle.Dashed, axisLabelVisible: true, title };
        if (existingLine) {
          existingLine.applyOptions(lineOptions);
        } else {
          priceLinesRef.current[key] = series.createPriceLine(lineOptions);
        }
      } else if (existingLine) {
        series.removePriceLine(existingLine);
        delete priceLinesRef.current[key];
      }
    };
    
    // Always create entry line
    updateOrCreatePriceLine("entry", tradeLevels.entry, "#42A5F5", "Entrada");

    // Conditionally create TP and SL lines
    if (marketType === 'futures' || (marketType === 'spot' && (tipoOperacao === 'compra' || tipoOperacao === 'venda'))) {
      updateOrCreatePriceLine("takeProfit", tradeLevels.takeProfit, "#26A69A", "Take Profit");
      updateOrCreatePriceLine("stopLoss", tradeLevels.stopLoss, "#EF5350", "Stop Loss");
    } else {
        // If conditions are not met, remove them
        updateOrCreatePriceLine("takeProfit", 0, "", "");
        updateOrCreatePriceLine("stopLoss", 0, "", "");
    }

  }, [isChartReady, tradeLevels, tipoOperacao, marketType, seriesRef]);
};