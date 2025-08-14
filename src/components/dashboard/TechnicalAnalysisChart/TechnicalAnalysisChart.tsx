"use client";

import React, { useEffect, useRef, memo } from "react";
import * as LightweightCharts from "lightweight-charts";
import styles from "./TechnicalAnalysisChart.module.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketData } from "@/components/dashboard/MarketData/MarketData";
import { CryptoList } from "@/components/dashboard/CryptoList/CryptoList";

// Sample data for candlestick chart
const candlestickData = [
  { time: "2023-05-15", open: 165.1, high: 166.2, low: 163.5, close: 164.8 },
  { time: "2023-05-16", open: 164.8, high: 168.1, low: 164.2, close: 167.9 },
  { time: "2023-05-17", open: 167.9, high: 170.3, low: 167.5, close: 169.8 },
  { time: "2023-05-18", open: 169.8, high: 172.5, low: 169.1, close: 172.0 },
  { time: "2023-05-19", open: 172.0, high: 173.8, low: 171.5, close: 173.2 },
  { time: "2023-05-22", open: 173.2, high: 175.0, low: 172.8, close: 174.5 },
  { time: "2023-05-23", open: 174.5, high: 175.5, low: 173.1, close: 173.8 },
  { time: "2023-05-24", open: 173.8, high: 174.2, low: 171.9, close: 172.5 },
  { time: "2023-05-25", open: 172.5, high: 173.9, low: 170.8, close: 171.4 },
  { time: "2023-05-26", open: 171.4, high: 172.1, low: 169.5, close: 170.2 },
];

// Trade levels
const tradeLevels = {
  entry: 168.0,
  takeProfit: 175.0,
  stopLoss: 164.0,
};

export const TechnicalAnalysisChart = memo(() => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

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

    candlestickSeries.setData(candlestickData);

    // Price Lines for Trade Levels
    const createPriceLine = (value: number, title: string, color: string) => {
      return candlestickSeries.createPriceLine({
        price: value,
        color: color,
        lineWidth: 2,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: title,
      });
    };

    createPriceLine(tradeLevels.entry, "Entrada", "#42A5F5"); // Blue for entry
    createPriceLine(tradeLevels.takeProfit, "Take Profit", "#26A69A"); // Green for profit
    createPriceLine(tradeLevels.stopLoss, "Stop Loss", "#EF5350"); // Red for loss

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise Técnica - Ativo Exemplo</CardTitle>
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