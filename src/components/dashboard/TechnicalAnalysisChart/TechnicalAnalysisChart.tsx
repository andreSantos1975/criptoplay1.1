"use client";

import React, { useEffect, useRef, memo } from "react";
import * as LightweightCharts from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import styles from "./TechnicalAnalysisChart.module.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketData } from "@/components/dashboard/MarketData/MarketData";
import { CryptoList } from "@/components/dashboard/CryptoList/CryptoList";

const fetchBinanceKlines = async () => {
  const response = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=90');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  return data.map((kline: any) => ({
    time: kline[0] / 1000,
    open: parseFloat(kline[1]),
    high: parseFloat(kline[2]),
    low: parseFloat(kline[3]),
    close: parseFloat(kline[4]),
  }));
};

export const TechnicalAnalysisChart = memo(() => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['binanceKlines'],
    queryFn: fetchBinanceKlines,
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!chartContainerRef.current || !chartData) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
    };

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      layout: {
        background: { type: LightweightCharts.ColorType.Solid, color: "#131722" },
        textColor: "#D9D9D9",
      },
      grid: {
        vertLines: { color: "#2A2E39" },
        horzLines: { color: "#2A2E39" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    chart.timeScale().fitContent();

    const candlestickSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });

    candlestickSeries.setData(chartData);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [chartData]);

  if (isLoading) {
    return <div>Loading chart...</div>;
  }

  if (error) {
    return <div>Error fetching chart data</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise Técnica - BTC/USDT (Binance)</CardTitle>
      </CardHeader>
      <CardContent>
        <MarketData />
        <div ref={chartContainerRef} className={styles.chartContainer} />
        <CryptoList />
      </CardContent>
    </Card>
  );
});

TechnicalAnalysisChart.displayName = "TechnicalAnalysisChart";

export default TechnicalAnalysisChart;