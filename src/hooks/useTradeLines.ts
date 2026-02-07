
import { useEffect, useRef, useState, useCallback } from 'react';
import { IChartApi, ISeriesApi, IPriceLine, LineStyle } from 'lightweight-charts';

/// Props para o nosso hook
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
    console.log(`[useTradeLines] Chamando cleanupLines. Series disponível: ${!!series}. Tipo de linesRef: ${linesRef.current instanceof Map ? 'Map' : typeof linesRef.current}`);
    if (series && linesRef.current) {
      if (linesRef.current instanceof Map) {
        linesRef.current.forEach((line, key) => {
          series.removePriceLine(line);
          console.log(`[useTradeLines] Removendo static price line: ${key}`);
        });
        linesRef.current.clear();
      } else if (typeof linesRef.current === 'object') {
        Object.values(linesRef.current).forEach((line: any) => {
          if (line) {
            series.removePriceLine(line);
            console.log(`[useTradeLines] Removendo prospective price line: ${line.options().title}`);
          }
        });
        linesRef.current = {};
      }
    }
  }, [seriesRef]);

  // Effect for STATIC lines from open positions
  useEffect(() => {
    const series = seriesRef.current;
    console.log(`[useTradeLines] useEffect de STATIC lines para símbolo: ${symbol}. isChartReady: ${isChartReady}. Series disponível: ${!!series}`);
    if (!isChartReady || !series) {
      console.log(`[useTradeLines] Cleanup de STATIC lines na inicialização/desativação.`);
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
            console.log(`[useTradeLines] Criando static price line: ${title}`);
          }
        }
      });
    }

    staticPriceLinesRef.current.forEach((line, key) => {
      if (!linesToKeep.has(key)) {
        series.removePriceLine(line);
        staticPriceLinesRef.current.delete(key);
        console.log(`[useTradeLines] Removendo static price line não necessária: ${key}`);
      }
    });

  }, [isChartReady, openPositions, symbol, seriesRef, cleanupLines, marketType]);
  
  // Effect for PROSPECTIVE (draggable) lines
  useEffect(() => {
    const series = seriesRef.current;
    console.log(`[useTradeLines] useEffect de PROSPECTIVE lines para símbolo: ${symbol}. isChartReady: ${isChartReady}. Series disponível: ${!!series}`);
    if (!isChartReady || !series) {
      cleanupLines(prospectivePriceLinesRef);
      return;
    }

    // Helper to check if values are close enough to be considered identical, avoiding float precision issues.
    const isNearlyEqual = (val1: number, val2: number | undefined | null) => {
      if (val2 === undefined || val2 === null || isNaN(Number(val2))) return false;
      return Math.abs(val1 - Number(val2)) < 1e-9;
    };
    
    // Declaração movida para cá
    const currentPosition = openPositions?.find(pos => pos.symbol === symbol); 
    
    // Limpar linhas prospectivas existentes no início para evitar duplicação ou persistência de linhas não desejadas
    // antes de potencialmente criar novas.
    Object.values(prospectivePriceLinesRef.current).forEach((line: any) => {
      if (line) {
        series.removePriceLine(line);
      }
    });
    prospectivePriceLinesRef.current = {}; // Limpa o ref para garantir que não haja referências a linhas removidas.

    // Apenas renderizar linhas prospectivas se houver um tipo de operação selecionado
    // E NÃO houver uma posição aberta para este símbolo.
    if ((tipoOperacao === 'compra' || tipoOperacao === 'venda') && !currentPosition) {
      const { takeProfit, stopLoss } = tradeLevels;

      // Renderizar Take Profit
      if (takeProfit > 0) {
        const tpLineOptions = createLineOptions(takeProfit, '#00C853', `TP Prosp.`, true);
        const tpLine = series.createPriceLine(tpLineOptions);
        prospectivePriceLinesRef.current.takeProfit = tpLine;
        console.log(`[useTradeLines] Criando prospective TP line para ${symbol} em ${takeProfit}`);
      }

      // Renderizar Stop Loss
      if (stopLoss > 0) {
        const slLineOptions = createLineOptions(stopLoss, '#D32F2F', `SL Prosp.`, true);
        const slLine = series.createPriceLine(slLineOptions);
        prospectivePriceLinesRef.current.stopLoss = slLine;
        console.log(`[useTradeLines] Criando prospective SL line para ${symbol} em ${stopLoss}`);
      }
    } else {
      // Se as condições não forem atendidas (ou seja, posição aberta, ou não em modo de planejamento),
      // garantir que todas as linhas prospectivas sejam removidas
      console.log(`[useTradeLines] Limpando PROSPECTIVE lines para ${symbol} - Condições não atendidas (posição aberta ou não em planejamento).`);
      cleanupLines(prospectivePriceLinesRef);
    }



  }, [isChartReady, tradeLevels, openPositions, symbol, seriesRef, cleanupLines, marketType, tipoOperacao]);


  // Effect for DRAG-AND-DROP listeners
  useEffect(() => {
    const chartElement = chartContainerRef.current;
    const chart = chartRef.current;
    const series = seriesRef.current;

    if (!isChartReady || !chartElement || !chart || !series) return;
    console.log(`[useTradeLines] Configurando DRAG-AND-DROP listeners para símbolo: ${symbol}`);

    const isNearPriceLine = (priceLine: IPriceLine, y: number) => {
      const priceY = series.priceToCoordinate(priceLine.options().price);
      return priceY !== null && Math.abs(priceY - y) < 20; // Increased tolerance for touch
    };

    const getEventY = (e: MouseEvent | TouchEvent): number => {
      const rect = chartElement.getBoundingClientRect();
      if (e instanceof MouseEvent) {
        return e.clientY - rect.top;
      }
      // For TouchEvent, use the first touch point
      return e.touches[0].clientY - rect.top;
    };

    const startDrag = (y: number) => {
      for (const key of ['takeProfit', 'stopLoss'] as const) {
        const priceLine = prospectivePriceLinesRef.current[key];
        if (priceLine && isNearPriceLine(priceLine, y)) {
          setDraggingLine(key);
          chart.applyOptions({ handleScroll: false, handleScale: false });
          chartElement.style.cursor = 'ns-resize';
          return true;
        }
      }
      return false;
    };

    const handleDragMove = (y: number) => {
      if (!draggingLine) return;
      const newPrice = series.coordinateToPrice(y);
      if (newPrice !== null) {
        onLevelsChangeRef.current({ ...tradeLevelsRef.current, [draggingLine]: newPrice });
      }
    };
    
    const stopDrag = () => {
      if (!draggingLine) return;
      setDraggingLine(null);
      chart.applyOptions({ handleScroll: true, handleScale: true });
      chartElement.style.cursor = 'default';
    };

    // --- Mouse Event Handlers ---
    const handleMouseDown = (e: MouseEvent) => {
      const y = getEventY(e);
      startDrag(y);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const y = getEventY(e);
      handleDragMove(y);
    };

    const handleMouseUp = () => {
      stopDrag();
    };

    // --- Touch Event Handlers ---
    const handleTouchStart = (e: TouchEvent) => {
      const y = getEventY(e);
      if (startDrag(y)) {
        // Prevent page scroll when dragging a line
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!draggingLine) return;
      // Prevent page scroll
      e.preventDefault(); 
      const y = getEventY(e);
      handleDragMove(y);
    };

    const handleTouchEnd = () => {
      stopDrag();
    };

    // Add Listeners
    chartElement.addEventListener('mousedown', handleMouseDown);
    chartElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    chartElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    chartElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);


    return () => {
      console.log(`[useTradeLines] Removendo DRAG-AND-DROP listeners para símbolo: ${symbol}`);
      // Remove Listeners
      chartElement.removeEventListener('mousedown', handleMouseDown);
      chartElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      chartElement.removeEventListener('touchstart', handleTouchStart);
      chartElement.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isChartReady, chartRef, seriesRef, chartContainerRef, draggingLine, symbol]); // Adicionei symbol aqui para o log ser mais útil


  // Cleanup on unmount
  useEffect(() => {
    console.log(`[useTradeLines] useEffect de UNMOUNT para símbolo: ${symbol}`);
    return () => {
      console.log(`[useTradeLines] Executando cleanup no UNMOUNT para símbolo: ${symbol}`);
      cleanupLines(staticPriceLinesRef);
      cleanupLines(prospectivePriceLinesRef);
    };
  }, [cleanupLines, symbol]); // Adicionei symbol aqui para o log ser mais útil
};

