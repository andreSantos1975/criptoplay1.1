import React, { useEffect, useRef, memo, useState } from "react";
import { createChart, ColorType, CrosshairMode, ISeriesApi, IChartApi, CandlestickSeries, BarData } from "lightweight-charts";
import styles from "./TechnicalAnalysisChart.module.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketData } from "@/components/dashboard/MarketData/MarketData";
import { CryptoList } from "@/components/dashboard/CryptoList/CryptoList";
import AssetHeader from "@/components/dashboard/AssetHeader/AssetHeader";
import { useTradeLines } from "../../../hooks/useTradeLines";
import { Trade } from "@prisma/client";

// This is a presentational component. All data is passed in via props.
// The complex data fetching and state management logic has been moved to the `useChartData` hook.

interface TechnicalAnalysisChartProps {
  chartSeriesData: BarData[] | undefined;
  headerData: BarData;
  isLoading: boolean;
  realtimeChartUpdate: BarData | null;
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
  openTrades?: Trade[];
}

export const TechnicalAnalysisChart = memo(
  ({
    chartSeriesData,
    headerData,
    isLoading,
    realtimeChartUpdate,
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
    openTrades,
  }: TechnicalAnalysisChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    
    const [isChartReady, setIsChartReady] = useState(false);
    const [newSymbolInput, setNewSymbolInput] = useState("");
    const [watchedSymbols, setWatchedSymbols] = useState<string[]>([]);

    // Hook for drawing trade entry/sl/tp lines
    useTradeLines({
      chartRef,
      seriesRef,
      chartContainerRef,
      tradeLevels,
      onLevelsChange,
      isChartReady,
      marketType,
      tipoOperacao,
      openTrades,
      symbol: selectedCrypto,
    });

    // Effect to create and cleanup the chart object
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
        borderVisible: false,
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

    // Effect to load historical data into the chart
    useEffect(() => {
      if (!isChartReady || !seriesRef.current || !chartSeriesData) return;
      seriesRef.current.setData(chartSeriesData);
    }, [isChartReady, chartSeriesData]);

    // Effect to update the chart with real-time ticks
    useEffect(() => {
        if (isChartReady && realtimeChartUpdate && seriesRef.current) {
            seriesRef.current.update(realtimeChartUpdate);
        }
    }, [isChartReady, realtimeChartUpdate]);

    // Effect to handle watched symbols based on market type
    useEffect(() => {
        if (marketType === 'futures') {
            setWatchedSymbols(["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "BNBUSDT", "DOGEUSDT", "SHIBUSDT"]);
        } else { // spot
            setWatchedSymbols(["BTCBRL", "ETHBRL", "SOLBRL", "XRPBRL", "ADABRL", "BNBBRL", "DOGEBRL", "SHIBBRL"]);
        }
    }, [marketType]);
    
    const handleAddSymbol = () => {
      if (newSymbolInput && !watchedSymbols.includes(newSymbolInput.toUpperCase())) {
        setWatchedSymbols(prev => [...prev, newSymbolInput.toUpperCase()]);
        setNewSymbolInput("");
      }
    };

    return (
      <Card>
        <CardHeader>
          {headerData && (
              <AssetHeader
                symbol={selectedCrypto}
                price={headerData.close}
                open={headerData.open}
                high={headerData.high}
                low={headerData.low}
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
            <button onClick={handleAddSymbol} className={styles.addSymbolButton}>
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
