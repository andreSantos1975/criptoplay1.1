import React, { useEffect, useRef, memo, useState, useMemo } from "react";
import {
  createChart, ColorType, CrosshairMode, ISeriesApi,
  IChartApi, CandlestickSeries, BarData
} from "lightweight-charts";
import styles from "./TechnicalAnalysisChart.module.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketData } from "@/components/dashboard/MarketData/MarketData";
import { CryptoList } from "@/components/dashboard/CryptoList/CryptoList";
import AssetHeader from "@/components/dashboard/AssetHeader/AssetHeader";
import { useTradeLines } from "../../../hooks/useTradeLines";

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
    
    const [isChartReady, setIsChartReady] = useState(false);
    const [newSymbolInput, setNewSymbolInput] = useState("");
    const [watchedSymbols, setWatchedSymbols] = useState<string[]>([]);

    // Use the custom hook for trade lines
    useTradeLines({
      chartRef,
      seriesRef,
      chartContainerRef,
      tradeLevels,
      onLevelsChange,
      isChartReady,
      marketType,
      tipoOperacao,
      isDraggable: true, // Lines are always draggable in this component
    });

    const handleAddSymbol = () => {
      if (newSymbolInput && !watchedSymbols.includes(newSymbolInput.toUpperCase())) {
        setWatchedSymbols(prev => [...prev, newSymbolInput.toUpperCase()]);
        setNewSymbolInput("");
      }
    };

    useEffect(() => {
        if (marketType === 'futures') {
            setWatchedSymbols([
                "BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT",
                "ADAUSDT", "BNBUSDT", "DOGEUSDT", "SHIBUSDT",
            ]);
        } else { // spot
            setWatchedSymbols([
                "BTCBRL", "ETHBRL", "SOLBRL", "XRPBRL",
                "ADABRL", "BNBBRL", "DOGEBRL", "SHIBBRL",
            ]);
        }
    }, [marketType]);

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

    // Effect to create and cleanup the chart (runs only once)
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

    // Load initial data
    useEffect(() => {
      if (!isChartReady || !seriesRef.current || !initialChartData) return;
      console.log(`Setting chart data for ${selectedCrypto}:`, initialChartData.slice(-5)); // Log last 5 data points
      seriesRef.current.setData(initialChartData);
    }, [isChartReady, initialChartData, selectedCrypto]);

    // Apply Dynamic Price Formatting
    useEffect(() => {
      const chart = chartRef.current;
      const series = seriesRef.current;
      if (!chart || !series || !initialChartData?.length) return;

      const lastPrice = initialChartData[initialChartData.length - 1]?.close || 0;
      
      let precision = 2;
      if (lastPrice > 0 && lastPrice < 0.1) {
        const priceStr = lastPrice.toFixed(20);
        const decimalPart = priceStr.split('.')[1];
        if (decimalPart) {
            const firstDigitIndex = decimalPart.search(/[1-9]/);
            if (firstDigitIndex !== -1) {
                precision = firstDigitIndex + 4; 
            }
        }
      }
      
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

    // Connect WebSocket
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
          <MarketData />
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