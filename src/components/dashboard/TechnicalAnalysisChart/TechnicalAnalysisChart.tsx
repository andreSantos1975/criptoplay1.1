"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  ISeriesApi,
  IPriceLine,
  MouseEventParams,
  CandlestickSeries, // <<— v5: importe a definição da série
  UTCTimestamp,
  IChartApi, // Add this import
} from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import styles from "./TechnicalAnalysisChart.module.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketData } from "@/components/dashboard/MarketData/MarketData";
import { CryptoList } from "@/components/dashboard/CryptoList/CryptoList";
import { TradePanel } from "@/components/dashboard/TradePanel/TradePanel";

type PriceLineKey = "entry" | "takeProfit" | "stopLoss";

type BinanceKlineData = [
  number, // Open time
  string, // Open
  string, // High
  string, // Low
  string, // Close
  string, // Volume
  number, // Close time
  string, // Quote asset volume
  number, // Number of trades
  string, // Taker buy base asset volume
  string, // Taker buy quote asset volume
  string  // Ignore
];



interface TechnicalAnalysisChartProps {
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number };
  onLevelsChange: (newLevels: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
  }) => void;
  children: React.ReactNode;
  selectedCrypto: string; // New prop
  onCryptoSelect: (symbol: string) => void; // New prop
}

export const TechnicalAnalysisChart = memo(
  ({ tradeLevels, onLevelsChange, children, selectedCrypto, onCryptoSelect }: TechnicalAnalysisChartProps) => {
    console.log('TechnicalAnalysisChart rendered with:', { tradeLevels, selectedCrypto });
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<Record<string, ISeriesApi<"Candlestick"> | null>>({});
    const priceLinesRef = useRef<Partial<Record<PriceLineKey, IPriceLine>>>({});
    const draggedLineRef = useRef<{ line: IPriceLine; key: PriceLineKey } | null>(null);
    const [interval, setInterval] = useState("1d");
    const [newSymbolInput, setNewSymbolInput] = useState('');

    const latestTradeLevelsRef = useRef(tradeLevels);
    useEffect(() => {
      latestTradeLevelsRef.current = tradeLevels;
    }, [tradeLevels]);

    const handleAddSymbol = (symbolToAdd?: string) => {
      const symbol = symbolToAdd || newSymbolInput.trim();
      if (symbol === '') return;
      const formattedSymbol = symbol.toUpperCase();
      if (!watchedSymbols.includes(formattedSymbol)) {
        setWatchedSymbols(prevSymbols => [...prevSymbols, formattedSymbol]);
        if (!symbolToAdd) {
          setNewSymbolInput('');
        }
      }
    };

    const [watchedSymbols, setWatchedSymbols] = useState<string[]>([
      'BTCUSDT',
      'ETHUSDT',
      'SOLUSDT',
      'XRPUSDT',
      'ADAUSDT',
      'BNBUSDT',
      'DOGEUSDT',
      'SHIBUSDT',
    ]);
    const { data: chartData, isLoading, error } = useQuery({
      queryKey: ["binanceKlines", interval, selectedCrypto], // Use selectedCrypto
      queryFn: async () => {
        const response = await fetch(
          `/api/binance/klines?symbol=${selectedCrypto}&interval=${interval}` // Use selectedCrypto
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const data: BinanceKlineData[] = await response.json();
        return data.map((k) => ({
          time: (k[0] / 1000) as UTCTimestamp,
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
        }));
      },
      refetchInterval: 60000,
    });

    useEffect(() => {
      if (!chartContainerRef.current || !chartData || chartData.length === 0) return;

      // If a chart already exists, remove it and clear its series
      if (chartRef.current) {
        Object.values(seriesRef.current).forEach(series => {
          if (series) chartRef.current?.removeSeries(series); // Remove from the *old* chart
        });
        chartRef.current.remove(); // Remove the old chart instance
        chartRef.current = null; // Clear the ref
        seriesRef.current = {}; // Clear series ref as well
      }

      // Create a new chart instance
      const chart = createChart(chartContainerRef.current, {
        layout: { background: { type: ColorType.Solid, color: "#131722" }, textColor: "#D9D9D9" },
        grid: { vertLines: { color: "#2A2E39" }, horzLines: { color: "#2A2E39" } },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        crosshair: { mode: CrosshairMode.Normal },
        handleScroll: true,
        handleScale: true,
      });
      chartRef.current = chart; // Store the new chart instance

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderUpColor: "#26a69a",
        borderDownColor: "#ef5350",
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
        title: selectedCrypto,
        priceFormat: { // Add this block
          type: 'price',
          precision: 8, // Set a high precision
          minMove: 0.00000001, // Smallest price increment
        },
      });
      candlestickSeries.setData(chartData);
      seriesRef.current[selectedCrypto] = candlestickSeries;

      // Price lines will be associated with the primary series
      const primarySeries = candlestickSeries;

      if (primarySeries) {
        const createPriceLine = (price: number, color: string, title: string) =>
          primarySeries.createPriceLine({
            price,
            color,
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title,
          });

        priceLinesRef.current.entry = createPriceLine(tradeLevels.entry, "#42A5F5", "Entrada");
        priceLinesRef.current.takeProfit = createPriceLine(tradeLevels.takeProfit, "#26A69A", "Take Profit");
        priceLinesRef.current.stopLoss = createPriceLine(tradeLevels.stopLoss, "#EF5350", "Stop Loss");
      }

      // Click para "pegar/soltar" a linha + mover com o crosshair
      const onClick = (param: MouseEventParams) => {
        const series = primarySeries; // Use primarySeries for price line interaction
        if (!series || !param.point) return;

        // já estava arrastando -> solta e confirma
        if (draggedLineRef.current) {
          const { key, line } = draggedLineRef.current;
          onLevelsChange({ ...latestTradeLevelsRef.current, [key]: line.options().price });
          draggedLineRef.current = null;
          chart.applyOptions({ handleScroll: true, handleScale: true }); // Use local 'chart' variable
          return;
        }

        // tenta "pegar" uma linha próxima
        const y = param.point.y;
        const priceAtCursor = series.coordinateToPrice(y);
        if (priceAtCursor == null) return;

        const pTop = series.coordinateToPrice(y - 6);
        const pBottom = series.coordinateToPrice(y + 6);
        if (pTop == null || pBottom == null) return;
        const tolerance = Math.abs(pTop - pBottom);

        (Object.keys(priceLinesRef.current) as PriceLineKey[]).forEach((key) => {
          const line = priceLinesRef.current[key];
          if (!line) return;
          if (Math.abs(line.options().price - priceAtCursor) <= tolerance) {
            draggedLineRef.current = { line, key };
            chart.applyOptions({ handleScroll: false, handleScale: false }); // Use local 'chart' variable
          }
        });
      };

      const onCrosshairMove = (param: MouseEventParams) => {
        if (!draggedLineRef.current) return;
        const series = primarySeries; // Use primarySeries for price line interaction
        if (!series || !param.point) return;

        const price = series.coordinateToPrice(param.point.y);
        if (price != null) draggedLineRef.current.line.applyOptions({ price });
      };

      chart.subscribeClick(onClick);
      chart.subscribeCrosshairMove(onCrosshairMove);

      const handleResize = () =>
        chart.applyOptions({ width: chartContainerRef.current?.clientWidth || 0 });
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        // Only remove chart if it was created in this effect run
        if (chartRef.current) {
          chartRef.current.unsubscribeClick(onClick);
          chartRef.current.unsubscribeCrosshairMove(onCrosshairMove);
          chartRef.current.remove();
          chartRef.current = null; // Clear the ref
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartData, selectedCrypto]); // Depend on selectedCrypto

    useEffect(() => {
      if (priceLinesRef.current.entry)
        priceLinesRef.current.entry.applyOptions({ price: tradeLevels.entry });
      if (priceLinesRef.current.takeProfit)
        priceLinesRef.current.takeProfit.applyOptions({ price: tradeLevels.takeProfit });
      if (priceLinesRef.current.stopLoss)
        priceLinesRef.current.stopLoss.applyOptions({ price: tradeLevels.stopLoss });
    }, [tradeLevels]);

    if (isLoading) return <div>Loading chart...</div>;
    if (error) return <div>Error fetching chart data</div>;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise Técnica - {selectedCrypto} (Binance)</CardTitle>
        </CardHeader>
        <CardContent>
          <MarketData />
          <div className={styles.intervalSelector}>
            {["1m", "15m", "1h", "1d"].map((int) => (
              <button
                key={int}
                onClick={() => setInterval(int)}
                className={interval === int ? styles.active : ""}
              >
                {int}
              </button>
            ))}
          </div>
          <div ref={chartContainerRef} className={styles.chartContainer} />
          <TradePanel tradeLevels={tradeLevels} onLevelsChange={onLevelsChange} />
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
          
          <CryptoList watchedSymbols={watchedSymbols} onCryptoSelect={onCryptoSelect} /> {/* Use onCryptoSelect prop */}
        </CardContent>
      </Card>
    );
  }
);

TechnicalAnalysisChart.displayName = "TechnicalAnalysisChart";
export default TechnicalAnalysisChart;
