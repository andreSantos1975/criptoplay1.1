"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import {
  createChart, ColorType, CrosshairMode, ISeriesApi,
  IChartApi, BarData, CandlestickSeries, IPriceLine, LineStyle, PriceLineOptions, LineWidth
} from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import styles from "./SimulatorChart.module.css";

type PriceLineKey = "entry" | "takeProfit" | "stopLoss";

type BinanceKlineData = [
  number, string, string, string, string, string, number,
  string, number, string, string, string
];

interface SimulatorChartProps {
  symbol: string;
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number };
  onLevelsChange: (levels: { entry: number; takeProfit: number; stopLoss: number; }) => void;
}

export const SimulatorChart = memo(({ symbol, tradeLevels, onLevelsChange }: SimulatorChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<Partial<Record<PriceLineKey, IPriceLine>>>({});
  
  const [interval, setInterval] = useState("1m");
  const [isChartReady, setIsChartReady] = useState(false);
  const [draggingLine, setDraggingLine] = useState<PriceLineKey | null>(null);

  // Refs to hold the latest props for use in callbacks without causing re-renders
  const onLevelsChangeRef = useRef(onLevelsChange);
  onLevelsChangeRef.current = onLevelsChange;
  const tradeLevelsRef = useRef(tradeLevels);
  tradeLevelsRef.current = tradeLevels;

  const { data: initialChartData, isFetching } = useQuery({
    queryKey: ["binanceKlines", "spot", interval, symbol],
    queryFn: async () => {
      const response = await fetch(`/api/binance/klines?symbol=${symbol}&interval=${interval}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data: BinanceKlineData[] = await response.json();
      return data.map(k => ({ time: k[0] / 1000, open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]) } as BarData));
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    enabled: !!symbol,
  });

  // Effect to create and cleanup the chart
  useEffect(() => {
    const chartElement = chartContainerRef.current;
    if (!chartElement) return;

    const chart = createChart(chartElement, {
      layout: { background: { type: ColorType.Solid, color: "#131722" }, textColor: "#D9D9D9" },
      grid: { vertLines: { color: "#2A2E39" }, horzLines: { color: "#2A2E39" } },
      width: chartElement.clientWidth,
      height: chartElement.clientHeight,
      crosshair: { mode: CrosshairMode.Normal },
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

    const handleResize = () => chart.applyOptions({ width: chartElement.clientWidth, height: chartElement.clientHeight });
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
        // Entry line should not be draggable
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
  }, [isChartReady, draggingLine]);

  // Load initial data
  useEffect(() => {
    if (isChartReady && seriesRef.current && initialChartData) {
      seriesRef.current.setData(initialChartData);
    }
  }, [isChartReady, initialChartData]);
  
  // Update Price Lines
  useEffect(() => {
    const series = seriesRef.current;
    if (!isChartReady || !series || !tradeLevels) return;

    const updateOrCreatePriceLine = (key: PriceLineKey, price: number, color: string, title: string) => {
      const existingLine = priceLinesRef.current[key];
      if (price > 0) {
        const lineOptions = { 
            price, 
            color, 
            lineWidth: 2 as LineWidth, 
            lineStyle: LineStyle.Dashed, 
            axisLabelVisible: true, 
            title 
        };
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

    updateOrCreatePriceLine("entry", tradeLevels.entry, "#42A5F5", "Entrada");
    updateOrCreatePriceLine("takeProfit", tradeLevels.takeProfit, "#26A69A", "Take Profit");
    updateOrCreatePriceLine("stopLoss", tradeLevels.stopLoss, "#EF5350", "Stop Loss");
  }, [isChartReady, tradeLevels]);


  // Apply BRL formatting
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

  // Connect WebSocket for real-time updates
  useEffect(() => {
    if (!isChartReady || !seriesRef.current || !symbol) return;

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
    
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
  }, [isChartReady, symbol, interval]);
    
  return (
    <div>
      <div className={styles.chartHeader}>
        <h2 className={styles.title}>Gráfico de Preços: {symbol}</h2>
        <div className={styles.intervalSelector}>
          {["1m", "15m", "1h", "1d"].map(int => (
            <button 
              key={int} 
              onClick={() => setInterval(int)} 
              className={interval === int ? styles.active : ""}
              disabled={isFetching}
            >
              {int}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className={styles.chartContainer} />
    </div>
  );
});

SimulatorChart.displayName = "SimulatorChart";
export default SimulatorChart;
