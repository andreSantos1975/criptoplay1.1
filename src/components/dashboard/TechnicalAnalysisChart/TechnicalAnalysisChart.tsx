"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import {
  createChart, ColorType, CrosshairMode, LineStyle, ISeriesApi,
  IPriceLine, IChartApi, CandlestickSeries, BarData
} from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import styles from "./TechnicalAnalysisChart.module.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketData } from "@/components/dashboard/MarketData/MarketData";
import { CryptoList } from "@/components/dashboard/CryptoList/CryptoList";

type PriceLineKey = "entry" | "takeProfit" | "stopLoss";

type BinanceKlineData = [
  number, string, string, string, string, string, number,
  string, number, string, string, string
];

interface TechnicalAnalysisChartProps {
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
    
    const [interval, setInterval] = useState("1d");
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

    const handleAddSymbol = (symbolToAdd?: string) => {
      const symbol = symbolToAdd || newSymbolInput.trim();
      if (symbol === "") return;
      const formattedSymbol = symbol.toUpperCase();
      if (!watchedSymbols.includes(formattedSymbol)) {
        setWatchedSymbols((prev) => [...prev, formattedSymbol]);
        if (!symbolToAdd) setNewSymbolInput("");
      }
    };



    const { data: initialChartData } = useQuery({
      queryKey: ["binanceKlines", marketType, interval, selectedCrypto],
      queryFn: async () => {
        const apiPath = marketType === "futures" ? "futures-klines" : "klines";
        const symbolForApi = selectedCrypto;
        const response = await fetch(`/api/binance/${apiPath}?symbol=${symbolForApi}&interval=${interval}`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data: BinanceKlineData[] = await response.json();
        return data.map(k => ({ time: k[0] / 1000, open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]) } as BarData));
      },
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    });

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

    // 4. Apply BRL formatting
    useEffect(() => {
      const chart = chartRef.current;
      if (!chart || !initialChartData?.length) return;

      const firstPrice = initialChartData[0]?.close || 0;
      const precision = firstPrice < 1 ? 4 : 2;

      chart.applyOptions({
        localization: {
          priceFormatter: (price: number) => {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: precision,
              maximumFractionDigits: precision,
            }).format(price);
          },
        },
      });
    }, [isChartReady, initialChartData]);

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
        <CardHeader><CardTitle>Análise Técnica - {selectedCrypto} (Binance)</CardTitle></CardHeader>
        <CardContent>
          <MarketData selectedCrypto={selectedCrypto} marketType={marketType} />
          <div className={styles.intervalSelector}>
            {["1m", "15m", "1h", "1d"].map(int => <button key={int} onClick={() => setInterval(int)} className={interval === int ? styles.active : ""}>{int}</button>)}
          </div>
          <div ref={chartContainerRef} className={styles.chartContainer} />
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
