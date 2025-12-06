import React, { useEffect, useRef, memo, useState, useMemo } from "react";
import {
  createChart, ColorType, CrosshairMode, LineStyle, ISeriesApi,
  IPriceLine, IChartApi, CandlestickSeries, BarData
} from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import styles from "./TechnicalAnalysisChart.module.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketData } from "@/components/dashboard/MarketData/MarketData";
import { CryptoList } from "@/components/dashboard/CryptoList/CryptoList";
import AssetHeader from "@/components/dashboard/AssetHeader/AssetHeader";

type PriceLineKey = "entry" | "takeProfit" | "stopLoss";

type BinanceKlineData = [
  number, string, string, string, string, string, number,
  string, number, string, string, string
];

interface TechnicalAnalysisChartProps {
  initialChartData: BarData[] | undefined;
  isLoading: boolean;
  interval: string;
  onIntervalChange: (interval: string) => void;
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number };
  onLevelsChange: (levels: { entry: number; takeProfit: number; stopLoss: number; }) => void;
  children?: React.ReactNode;
  selectedCrypto: string;
  onCryptoSelect: (symbol: string) => void;
  marketType: "spot" | "futures";
  onMarketTypeChange: (marketType: "spot" | "futures") => void;
  tipoOperacao: "compra" | "venda" | "";
}

export const TechnicalAnalysisChart = memo(
  ({
    initialChartData,
    isLoading,
    interval,
    onIntervalChange,
    tradeLevels,
    onLevelsChange,
    children,
    selectedCrypto,
    onCryptoSelect,
    marketType,
    onMarketTypeChange,
    tipoOperacao,
  }: TechnicalAnalysisChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const priceLinesRef = useRef<Partial<Record<PriceLineKey, IPriceLine>>>({});
    
    const [isChartReady, setIsChartReady] = useState(false);
    const [newSymbolInput, setNewSymbolInput] = useState("");
    const [watchedSymbols, setWatchedSymbols] = useState<string[]>([
      "BTCBRL", "ETHBRL", "SOLBRL", "XRPBRL",
      "ADABRL", "BNBBRL", "DOGEBRL", "SHIBBRL",
    ]);
    const [draggingLine, setDraggingLine] = useState<PriceLineKey | null>(null);

    // Refs to hold the latest props for use in callbacks without causing re-renders
    const onLevelsChangeRef = useRef(onLevelsChange);
    onLevelsChangeRef.current = onLevelsChange;
    const tradeLevelsRef = useRef(tradeLevels);
    tradeLevelsRef.current = tradeLevels;

    const latestKlineForHeader = useMemo(() => {
      if (!initialChartData || initialChartData.length === 0) return null;
      const latestKline = initialChartData[initialChartData.length - 1];
      return {
        symbol: selectedCrypto,
        price: latestKline.close,
        open: latestKline.open,
        high: latestKline.high,
        low: latestKline.low,
      };
    }, [initialChartData, selectedCrypto]);

    // 1. Effect to create and cleanup the chart (runs only once)
    useEffect(() => {
      const chartElement = chartContainerRef.current;
      if (!chartElement) return;

      const chart = createChart(chartElement, {
        layout: { background: { type: ColorType.Solid, color: "#131722" }, textColor: "#D9D9D9" },
        grid: { vertLines: { color: "#2A2E39" }, horzLines: { color: "#2A2E39" } },
        width: chartElement.clientWidth, height: 400, crosshair: { mode: CrosshairMode.Normal },
      });
      chartRef.current = chart;
      
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderUpColor: "#26a69a",
        borderDownColor: "#ef5350",
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });
      seriesRef.current = series;

      const handleResize = () => chart.applyOptions({ width: chartElement.clientWidth });
      window.addEventListener("resize", handleResize);
      setIsChartReady(true);

      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
        setIsChartReady(false);
      };
    }, []);

    // 2. Effect to setup drag-and-drop listeners (runs when chart is ready)
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
          // Use refs to get the latest props without causing re-renders
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
    }, [isChartReady, draggingLine]); // Rerun only when chart is ready or dragging state changes

    // 3. Load initial data
    useEffect(() => {
      if (!isChartReady || !seriesRef.current || !initialChartData) return;
      console.log(`Setting chart data for ${selectedCrypto}:`, initialChartData.slice(-5)); // Log last 5 data points
      seriesRef.current.setData(initialChartData);
    }, [isChartReady, initialChartData, selectedCrypto]);

    // 4. Apply Dynamic Price Formatting
    useEffect(() => {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series || !initialChartData?.length) return;

      const lastPrice = initialChartData[initialChartData.length - 1]?.close || 0;
      
      let precision = 2;
      // More robust precision calculation for very small numbers
      if (lastPrice > 0 && lastPrice < 0.1) {
        const priceStr = lastPrice.toFixed(20); // Use toFixed for a consistent string format
        const decimalPart = priceStr.split('.')[1];
        if (decimalPart) {
            const firstDigitIndex = decimalPart.search(/[1-9]/);
            if (firstDigitIndex !== -1) {
                // Add 4 to show a few significant digits after the leading zeros
                precision = firstDigitIndex + 4; 
            }
        }
      }
      
      // Cap precision to a reasonable max (Binance uses up to 8 for many pairs)
      if (precision > 8) precision = 8;

      const minMove = 1 / Math.pow(10, precision);
      
      const currency = selectedCrypto.endsWith('USDT') ? 'USD' : 'BRL';
      const locale = selectedCrypto.endsWith('USDT') ? 'en-US' : 'pt-BR';

      series.applyOptions({
        priceFormat: {
          type: 'price',
          precision: precision,
          minMove: minMove,
        },
      });

      chart.applyOptions({
        localization: {
          priceFormatter: (price: number) => {
            return new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: currency,
              minimumFractionDigits: precision,
              maximumFractionDigits: precision,
            }).format(price);
          },
        },
      });
    }, [isChartReady, initialChartData, selectedCrypto]);

    // 5. Connect WebSocket
    useEffect(() => {
      if (!isChartReady || !seriesRef.current || !selectedCrypto) return;

      let wsUrl;
      if (marketType === 'spot') {
        wsUrl = `wss://stream.binance.com:9443/ws/${selectedCrypto.toLowerCase()}@kline_${interval}`;
      } else {
        wsUrl = `wss://fstream.binance.com/ws/${selectedCrypto.toLowerCase()}@kline_${interval}`;
      }

      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const kline = message.k;
        if (kline) {
          seriesRef.current?.update({ time: kline.t / 1000, open: parseFloat(kline.o), high: parseFloat(kline.h), low: parseFloat(kline.l), close: parseFloat(kline.c) } as BarData);
        }
      };

      return () => {
        ws.close();
      };
    }, [isChartReady, selectedCrypto, interval, marketType]);

    // 6. Update Price Lines
    useEffect(() => {
      const series = seriesRef.current;
      if (!isChartReady || !series || !tradeLevels) return;

      Object.values(priceLinesRef.current).forEach(line => line && series.removePriceLine(line));
      priceLinesRef.current = {};

      const createPriceLine = (key: PriceLineKey, price: number, color: string, title: string) => {
        if (price > 0) {
          priceLinesRef.current[key] = series.createPriceLine({ price, color, lineWidth: 2, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title });
        }
      };

      createPriceLine("entry", tradeLevels.entry, "#42A5F5", "Entrada");
      if (marketType === 'futures' || (marketType === 'spot' && (tipoOperacao === 'compra' || tipoOperacao === 'venda'))) {
        createPriceLine("takeProfit", tradeLevels.takeProfit, "#26A69A", "Take Profit");
        createPriceLine("stopLoss", tradeLevels.stopLoss, "#EF5350", "Stop Loss");
      }
    }, [isChartReady, tradeLevels, tipoOperacao, marketType]);
    
    return (
      <Card>
        <CardHeader>
          {latestKlineForHeader && (
              <AssetHeader
                symbol={latestKlineForHeader.symbol}
                price={latestKlineForHeader.price}
                open={latestKlineForHeader.open}
                high={latestKlineForHeader.high}
                low={latestKlineForHeader.low}
              />
            )}
          <CardTitle>Análise Técnica - {selectedCrypto} (Binance)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div>Carregando gráfico...</div>}
          <MarketData selectedCrypto={selectedCrypto} marketType={marketType} />
          <div className={styles.intervalSelector}>
            {["1m", "15m", "1h", "1d"].map(int => <button key={int} onClick={() => onIntervalChange(int)} className={interval === int ? styles.active : ""}>{int}</button>)}
          </div>
          <div ref={chartContainerRef} className={styles.chartContainer} style={{ display: isLoading ? 'none' : 'block' }} />
          <div className={styles.marketSelector}>
            <button onClick={() => onMarketTypeChange("spot")} className={marketType === "spot" ? styles.active : ""}>Spot</button>
            <button onClick={() => onMarketTypeChange("futures")} className={marketType === "futures" ? styles.active : ""}>Futuros</button>
          </div>
          {children}
          <div className={styles.addSymbolContainer}>
            <input
              type="text"
              placeholder="Add symbol (e.g., ETHUSDT)"
              value={newSymbolInput}
              onChange={(e) => setNewSymbolInput(e.target.value)}
              className={styles.symbolInput}
            />
            <button onClick={() => handleAddSymbol()} className={styles.addSymbolButton}>
              Add Crypto
            </button>
          </div>
          <CryptoList watchedSymbols={watchedSymbols} onCryptoSelect={onCryptoSelect} />
        </CardContent>
      </Card>
    );
  }
);

TechnicalAnalysisChart.displayName = "TechnicalAnalysisChart";
export default TechnicalAnalysisChart;

