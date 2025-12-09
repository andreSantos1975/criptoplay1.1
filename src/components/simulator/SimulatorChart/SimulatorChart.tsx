"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import {
  createChart, ColorType, CrosshairMode, ISeriesApi,
  IChartApi, BarData, CandlestickSeries
} from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import styles from "./SimulatorChart.module.css";
import { useTradeLines } from "../../../hooks/useTradeLines";

type BinanceKlineData = [
  number, string, string, string, string, string, number,
  string, number, string, string, string
];

interface SimulatorChartProps {
  symbol: string;
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number };
  onLevelsChange: (levels: { entry: number; takeProfit: number; stopLoss: number; }) => void;
  tipoOperacao: 'compra' | 'venda' | '';
}

export const SimulatorChart = memo(({ symbol, tradeLevels, onLevelsChange, tipoOperacao }: SimulatorChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  
  const [interval, setInterval] = useState("1m");
  const [isChartReady, setIsChartReady] = useState(false);

  const { data: initialChartData, isFetching } = useQuery({
    queryKey: ["binanceKlines", "spot", interval, symbol],
    queryFn: async () => {
      const response = await fetch(`/api/binance/klines?symbol=${symbol}&interval=${interval}`);
      if (!response.ok) throw new Error("Network response was not ok");
      const data: BinanceKlineData[] = await response.json();
      // Remove the last (potentially incomplete) candle from historical data
      const historicalData = data.slice(0, -1);
      return historicalData.map(k => ({ time: k[0] / 1000, open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]) } as BarData));
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    enabled: !!symbol,
  });

  // Use the custom hook to draw and manage trade lines
  useTradeLines({
    chartRef,
    seriesRef,
    chartContainerRef,
    tradeLevels,
    onLevelsChange,
    isChartReady,
    marketType: 'spot', // Simulator is always spot
    tipoOperacao: tipoOperacao,
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

  // Load initial data
  useEffect(() => {
    if (isChartReady && seriesRef.current && initialChartData) {
      seriesRef.current.setData(initialChartData);
    }
  }, [isChartReady, initialChartData]);

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