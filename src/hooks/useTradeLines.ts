
import { useEffect, useRef, useState, useCallback } from 'react';
import { IChartApi, ISeriesApi, IPriceLine, LineStyle } from 'lightweight-charts';

// Props para o nosso hook
interface UseTradeLinesProps {
  chartRef: React.RefObject<IChartApi | null>;
  seriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
  chartContainerRef: React.RefObject<HTMLDivElement>;
  isChartReady: boolean;
  openPositions: any[] | undefined;
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number };
  onLevelsChange: (levels: { entry: number; takeProfit: number; stopLoss: number }) => void;
  marketType: 'spot' | 'futures';
  tipoOperacao: 'compra' | 'venda' | '';
  symbol: string;
}

const createLineOptions = (price: number, color: string, title: string, isDashed: boolean = false) => ({
  price,
  color,
  lineWidth: 2 as const,
  lineStyle: isDashed ? LineStyle.Dashed : LineStyle.Solid,
  axisLabelVisible: true,
  title,
});

export const useTradeLines = ({
  chartRef,
  seriesRef,
  isChartReady,
  openPositions,
  tradeLevels,
  symbol,
  chartContainerRef,
  onLevelsChange,
  marketType,
  tipoOperacao,
}: UseTradeLinesProps) => {

  const staticPriceLinesRef = useRef<Map<string, IPriceLine>>(new Map());
  const prospectivePriceLinesRef = useRef<Partial<Record<'takeProfit' | 'stopLoss', IPriceLine>>>({});
  const [draggingLine, setDraggingLine] = useState<'takeProfit' | 'stopLoss' | null>(null);

  const onLevelsChangeRef = useRef(onLevelsChange);
  onLevelsChangeRef.current = onLevelsChange;
  const tradeLevelsRef = useRef(tradeLevels);
  tradeLevelsRef.current = tradeLevels;

  const cleanupLines = useCallback((linesRef: React.MutableRefObject<any>) => {
    const series = seriesRef.current;
    if (series && linesRef.current) {
      if (linesRef.current instanceof Map) {
        linesRef.current.forEach(line => series.removePriceLine(line));
        linesRef.current.clear();
      } else if (typeof linesRef.current === 'object') {
        Object.values(linesRef.current).forEach((line: any) => line && series.removePriceLine(line));
        linesRef.current = {};
      }
    }
  }, [seriesRef]);

  // Effect for STATIC lines from open positions
  useEffect(() => {
    const series = seriesRef.current;
    if (!isChartReady || !series) {
      cleanupLines(staticPriceLinesRef);
      return;
    }

    const currentPosition = openPositions?.find(pos => pos.symbol === symbol);
    const linesToKeep = new Set<string>();

    if (currentPosition) {
      const { averageEntryPrice, takeProfit, stopLoss } = currentPosition;

      const positionLines = [
        { key: 'entry', price: Number(averageEntryPrice), color: '#4CAF50', title: `Entrada Média`, isDashed: false },
        { key: 'tp', price: Number(takeProfit), color: '#00C853', title: `TP`, isDashed: true },
        { key: 'sl', price: Number(stopLoss), color: '#D32F2F', title: `SL`, isDashed: true },
      ];

      positionLines.forEach(({ key, price, color, title, isDashed }) => {
        if (price > 0) {
          linesToKeep.add(key);
          const lineOptions = createLineOptions(price, color, `${title} (${symbol})`, isDashed);
          const existingLine = staticPriceLinesRef.current.get(key);
          if (existingLine) {
            existingLine.applyOptions(lineOptions);
          } else {
            staticPriceLinesRef.current.set(key, series.createPriceLine(lineOptions));
          }
        }
      });
    }

    staticPriceLinesRef.current.forEach((line, key) => {
      if (!linesToKeep.has(key)) {
        series.removePriceLine(line);
        staticPriceLinesRef.current.delete(key);
      }
    });

  }, [isChartReady, openPositions, symbol, seriesRef, cleanupLines, marketType]);
  
  // Effect for PROSPECTIVE (draggable) lines
  useEffect(() => {
    const series = seriesRef.current;
    if (!isChartReady || !series) {
      cleanupLines(prospectivePriceLinesRef);
      return;
    }
    
    const isRedundant = (prospectiveVal: number, currentVal: number | undefined | null) => {
      if (currentVal === undefined || currentVal === null || isNaN(Number(currentVal)) || Number(currentVal) === 0) return false;
      const numCurrent = Number(currentVal);
      const diff = Math.abs(prospectiveVal - numCurrent);
      return diff < (numCurrent * 0.01) || diff < 0.01;
    };

    const currentPosition = openPositions?.find(pos => pos.symbol === symbol);

    // Take Profit
    if (tradeLevels.takeProfit > 0 && !isRedundant(tradeLevels.takeProfit, Number(currentPosition?.takeProfit))) {
      const tpOptions = createLineOptions(tradeLevels.takeProfit, '#66BB6A', 'TP Prev.', true);
      if (prospectivePriceLinesRef.current.takeProfit) {
        prospectivePriceLinesRef.current.takeProfit.applyOptions(tpOptions);
      } else {
        prospectivePriceLinesRef.current.takeProfit = series.createPriceLine(tpOptions);
      }
    } else {
      if (prospectivePriceLinesRef.current.takeProfit) {
        series.removePriceLine(prospectivePriceLinesRef.current.takeProfit);
        delete prospectivePriceLinesRef.current.takeProfit;
      }
    }

    // Stop Loss
    if (tradeLevels.stopLoss > 0 && !isRedundant(tradeLevels.stopLoss, Number(currentPosition?.stopLoss))) {
      const slOptions = createLineOptions(tradeLevels.stopLoss, '#FF7043', 'SL Prev.', true);
      if (prospectivePriceLinesRef.current.stopLoss) {
        prospectivePriceLinesRef.current.stopLoss.applyOptions(slOptions);
      } else {
        prospectivePriceLinesRef.current.stopLoss = series.createPriceLine(slOptions);
      }
    } else {
      if (prospectivePriceLinesRef.current.stopLoss) {
        series.removePriceLine(prospectivePriceLinesRef.current.stopLoss);
        delete prospectivePriceLinesRef.current.stopLoss;
      }
    }

  }, [isChartReady, tradeLevels, openPositions, symbol, seriesRef, cleanupLines]);


  // Effect for DRAG-AND-DROP listeners
  useEffect(() => {
    const chartElement = chartContainerRef.current;
    const chart = chartRef.current;
    const series = seriesRef.current;

    if (!isChartReady || !chartElement || !chart || !series) return;

    const isNearPriceLine = (priceLine: IPriceLine, y: number) => {
      const priceY = series.priceToCoordinate(priceLine.options().price);
      return priceY !== null && Math.abs(priceY - y) < 10;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = chartElement.getBoundingClientRect();
      const y = e.clientY - rect.top;
      for (const key of ['takeProfit', 'stopLoss'] as const) {
        const priceLine = prospectivePriceLinesRef.current[key];
        if (priceLine && isNearPriceLine(priceLine, y)) {
          setDraggingLine(key);
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
        onLevelsChangeRef.current({ ...tradeLevelsRef.current, [draggingLine]: newPrice });
      }
    };

    const handleMouseUp = () => {
      if (!draggingLine) return;
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
  }, [isChartReady, chartRef, seriesRef, chartContainerRef, draggingLine]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupLines(staticPriceLinesRef);
      cleanupLines(prospectivePriceLinesRef);
    };
  }, [cleanupLines]);
};

