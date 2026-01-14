
import { useEffect, useRef, useState } from 'react';
import { IChartApi, ISeriesApi, IPriceLine, LineStyle } from 'lightweight-charts';
import { Trade } from '@prisma/client';

// Props para o nosso hook
interface UseTradeLinesProps {
  chartRef: React.RefObject<IChartApi | null>;
  seriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
  chartContainerRef: React.RefObject<HTMLDivElement>;
  isChartReady: boolean;
  openPositions: any[] | undefined; // Nova prop para posições agregadas
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number }; // Linhas Prospectivas
  onLevelsChange: (levels: { entry: number; takeProfit: number; stopLoss: number }) => void;
  marketType: 'spot' | 'futures';
  tipoOperacao: 'compra' | 'venda' | ''; // Linhas Prospectivas
  symbol: string;
}

// Função auxiliar para criar opções de linha, mantida do antigo arquivo
const createLineOptions = (price: number, color: string, title: string, isDashed: boolean = false) => ({
  price,
  color,
  lineWidth: 2 as const,
  lineStyle: isDashed ? LineStyle.Dashed : LineStyle.Solid,
  axisLabelVisible: true,
  title,
});

/**
 * Um hook reescrito para gerenciar todas as linhas de trade (ativas e prospectivas) no gráfico.
 * Utiliza um único useEffect e um padrão de "limpar e recriar" para máxima robustez.
 */
export const useTradeLines = ({
  chartRef,
  seriesRef,
  isChartReady,
  openPositions, // Alterado de openTrades
  tradeLevels,
  symbol,
  chartContainerRef,
  onLevelsChange,
  marketType,
  tipoOperacao,
}: UseTradeLinesProps) => {

  // Um único ref para armazenar TODAS as linhas de preço que este hook gerencia.
  const priceLinesRef = useRef<IPriceLine[]>([]);

  // Refs para linhas de trade prospectivas (arrastáveis)
  const prospectivePriceLinesRef = useRef<Partial<Record<'entry' | 'takeProfit' | 'stopLoss', IPriceLine>>>({});
  const [draggingLine, setDraggingLine] = useState<'entry' | 'takeProfit' | 'stopLoss' | null>(null);

  // Refs para manter os valores mais recentes de props para uso em callbacks sem causar re-renderizações desnecessárias.
  const onLevelsChangeRef = useRef(onLevelsChange);
  onLevelsChangeRef.current = onLevelsChange;
  const tradeLevelsRef = useRef(tradeLevels);
  tradeLevelsRef.current = tradeLevels;


  useEffect(() => {
    const series = seriesRef.current;
    // Guarda de segurança: não faz nada se o gráfico ou a série não estiverem prontos.
    if (!isChartReady || !series) {
      return;
    }

    // --- 1. FASE DE LIMPEZA ---
    // Remove todas as linhas gerenciadas por este hook da execução anterior.
    priceLinesRef.current.forEach(line => {
      try {
        series.removePriceLine(line);
      } catch (e) {
        // Ignora erros se a linha já foi removida por algum outro motivo.
        console.warn('Falha ao remover linha (pode já ter sido removida):', e);
      }
    });
    priceLinesRef.current = []; // Esvazia o array de referências.
    prospectivePriceLinesRef.current = {}; // Limpa também as referências prospectivas para a nova renderização.

        // --- 2. FASE DE CRIAÇÃO ---
        
        // Desenha as linhas para a posição agregada (openPositions)
                const currentPosition = openPositions?.find(pos => pos.symbol === symbol);
            
                if (currentPosition) {            // Linha de Entrada (Preço Médio)
            const averageEntryPrice = Number(currentPosition.averageEntryPrice);
            if (averageEntryPrice > 0) {
                const line = series.createPriceLine(createLineOptions(averageEntryPrice, '#4CAF50', `Entrada Média (${currentPosition.symbol})`));
                priceLinesRef.current.push(line);
            }
            // Linha de Take Profit
            const takeProfitPrice = Number(currentPosition.takeProfit);
            if (takeProfitPrice && takeProfitPrice > 0) {
                const line = series.createPriceLine(createLineOptions(takeProfitPrice, '#00C853', `TP (${currentPosition.symbol})`, true));
                priceLinesRef.current.push(line);
            }
            // Linha de Stop Loss
            const stopLossPrice = Number(currentPosition.stopLoss);
            if (stopLossPrice && stopLossPrice > 0) {
                const line = series.createPriceLine(createLineOptions(stopLossPrice, '#D32F2F', `SL (${currentPosition.symbol})`, true));
                priceLinesRef.current.push(line);
            }
        }
    
        // Desenha as linhas para a operação prospectiva (tradeLevels)
        // A linha de Entrada Prospectiva foi removida para comportamento profissional (limpeza visual).
        // O usuário se baseia no preço atual (candle/ticker).
        
        // Helper para verificar se a linha prospectiva é redundante (já existe na posição atual)
        const isRedundant = (prospectiveVal: number, currentVal: number | undefined | null, label: string) => {
            // Se não tem posição ou valor atual, não é redundante (pode desenhar)
            if (!currentPosition || currentVal === undefined || currentVal === null) return false;
            
            const numCurrent = Number(currentVal);
            // Se o valor atual não é válido, não considera redundante
            if (isNaN(numCurrent) || numCurrent === 0) return false;

            const diff = Math.abs(prospectiveVal - numCurrent);
            
            // AUMENTO DE TOLERÂNCIA:
            // Considera redundante se a diferença for menor que 1% do valor atual.
            // Isso previne que pequenas diferenças de arredondamento causem duplicação visual.
            const isCloseEnough = diff < (numCurrent * 0.01) || diff < 0.01;
            
            return isCloseEnough;
        };

        // Linha de Take Profit Prospectiva
        // Só desenha se não for redundante com o TP da posição atual
        if (tradeLevels.takeProfit > 0 && !isRedundant(tradeLevels.takeProfit, Number(currentPosition?.takeProfit), 'TP')) {
          const line = series.createPriceLine(createLineOptions(tradeLevels.takeProfit, '#66BB6A', 'TP Prev.', true));
          priceLinesRef.current.push(line);
          prospectivePriceLinesRef.current.takeProfit = line;
        }
        // Linha de Stop Loss Prospectiva
        // Só desenha se não for redundante com o SL da posição atual
        if (tradeLevels.stopLoss > 0 && !isRedundant(tradeLevels.stopLoss, Number(currentPosition?.stopLoss), 'SL')) {
          const line = series.createPriceLine(createLineOptions(tradeLevels.stopLoss, '#FF7043', 'SL Prev.', true));
          priceLinesRef.current.push(line);
          prospectivePriceLinesRef.current.stopLoss = line;
        }    // --- 3. FUNÇÃO DE LIMPEZA PARA DESMONTAGEM ---
    // Retorna uma função que será chamada quando o componente for desmontado.
    // Isso é CRUCIAL para o Strict Mode e para a limpeza final.
    return () => {
      priceLinesRef.current.forEach(line => {
        try {
          series.removePriceLine(line);
        } catch (e) {
           console.warn('Falha ao remover linha na desmontagem:', e);
        }
      });
      priceLinesRef.current = [];
      prospectivePriceLinesRef.current = {}; // Limpa também as referências prospectivas
    };

  }, [isChartReady, openPositions, tradeLevels, symbol, seriesRef, prospectivePriceLinesRef]); // Adiciona prospectivePriceLinesRef nas dependências

  // Effect to setup drag-and-drop listeners for PROSPECTIVE lines
  useEffect(() => {
    const chartElement = chartContainerRef.current;
    const chart = chartRef.current;
    const series = seriesRef.current;

    if (!isChartReady || !chartElement || !chart || !series) return;

    const isNearPriceLine = (priceLine: IPriceLine, y: number) => {
      const priceY = series.priceToCoordinate(priceLine.options().price);
      return priceY !== null && Math.abs(priceY - y) < 10; // 10px tolerance
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = chartElement.getBoundingClientRect();
      const y = e.clientY - rect.top;

      // Only check TP and SL for prospective lines, entry is usually fixed
      for (const key of ['takeProfit', 'stopLoss'] as ('takeProfit' | 'stopLoss')[]) {
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
        onLevelsChangeRef.current({
          ...tradeLevelsRef.current,
          [draggingLine]: newPrice,
        });
      }
    };

    const handleMouseUp = () => {
      if (!draggingLine) return;

      setDraggingLine(null);
      chart.applyOptions({ handleScroll: true, handleScale: true });
      chartElement.style.cursor = 'default';
    };

    // --- Touch Support ---
    const handleTouchStart = (e: TouchEvent) => {
      const rect = chartElement.getBoundingClientRect();
      const y = e.touches[0].clientY - rect.top;

      for (const key of ['takeProfit', 'stopLoss'] as ('takeProfit' | 'stopLoss')[]) {
        const priceLine = prospectivePriceLinesRef.current[key];
        if (priceLine && isNearPriceLine(priceLine, y)) {
          setDraggingLine(key);
          chart.applyOptions({ handleScroll: false, handleScale: false });
          // Prevent default to stop scrolling/zooming while interacting with the line
          // e.preventDefault(); // Note: might need 'passive: false' in listener options
          return;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!draggingLine) return;
      e.preventDefault(); // Prevent page scrolling while dragging line

      const rect = chartElement.getBoundingClientRect();
      const y = e.touches[0].clientY - rect.top;
      const newPrice = series.coordinateToPrice(y);

      if (newPrice !== null) {
        onLevelsChangeRef.current({
          ...tradeLevelsRef.current,
          [draggingLine]: newPrice,
        });
      }
    };

    const handleTouchEnd = () => {
      if (!draggingLine) return;

      setDraggingLine(null);
      chart.applyOptions({ handleScroll: true, handleScale: true });
    };

    chartElement.addEventListener('mousedown', handleMouseDown);
    chartElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Add Touch Listeners
    chartElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    chartElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);


    return () => {
      chartElement.removeEventListener('mousedown', handleMouseDown);
      chartElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // Remove Touch Listeners
      chartElement.removeEventListener('touchstart', handleTouchStart);
      chartElement.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isChartReady, chartRef, seriesRef, chartContainerRef, setDraggingLine, draggingLine]);
};
