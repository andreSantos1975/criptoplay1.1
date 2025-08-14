"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import * as LightweightCharts from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import styles from "./TechnicalAnalysisChart.module.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketData } from "@/components/dashboard/MarketData/MarketData";
import { CryptoList } from "@/components/dashboard/CryptoList/CryptoList";
import { TradePanel } from "@/components/dashboard/TradePanel/TradePanel";

const fetchBinanceKlines = async (interval: string) => {
  const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=365`);
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

interface TechnicalAnalysisChartProps {
  tradeLevels: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
  };
  onLevelsChange: (newLevels: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
  }) => void;
}

export const TechnicalAnalysisChart = memo(({ tradeLevels, onLevelsChange }: TechnicalAnalysisChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<LightweightCharts.IChartApi | null>(null);
  const seriesRef = useRef<LightweightCharts.ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<Record<string, LightweightCharts.IPriceLine | null>>({});
  const draggedLineRef = useRef<{ line: LightweightCharts.IPriceLine; key: string } | null>(null);
  const [interval, setInterval] = useState('1d');

  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['binanceKlines', interval],
    queryFn: () => fetchBinanceKlines(interval),
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!chartContainerRef.current || !chartData) return;

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
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
      },
    });
    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });
    seriesRef.current = candlestickSeries;
    candlestickSeries.setData(chartData);

    const createPriceLine = (price: number, color: string, title: string) => {
      return candlestickSeries.createPriceLine({
        price,
        color,
        lineWidth: 2,
        lineStyle: LightweightCharts.LineStyle.Dashed,
        axisLabelVisible: true,
        title,
      });
    };

    priceLinesRef.current.entry = createPriceLine(tradeLevels.entry, '#42A5F5', 'Entrada');
    priceLinesRef.current.takeProfit = createPriceLine(tradeLevels.takeProfit, '#26A69A', 'Take Profit');
    priceLinesRef.current.stopLoss = createPriceLine(tradeLevels.stopLoss, '#EF5350', 'Stop Loss');

    const onMouseDown = (param: LightweightCharts.MouseEventParams) => {
      if (!param.point || !seriesRef.current) return;

      const price = seriesRef.current.coordinateToPrice(param.point.y);
      const chart = chartRef.current;
      if (!chart) return;

      const priceRange = chart.priceScale().getVisiblePriceRange();
      if (!priceRange) return;

      const tolerance = (priceRange.to - priceRange.from) * 0.02;

      Object.keys(priceLinesRef.current).forEach(key => {
        const line = priceLinesRef.current[key];
        if (line && Math.abs(line.options().price - price) < tolerance) {
          draggedLineRef.current = { line, key };
          chart.applyOptions({ handleScroll: false, handleScale: false });
        }
      });
    };

    const onMouseMove = (param: LightweightCharts.MouseEventParams) => {
      if (!param.point || !draggedLineRef.current || !seriesRef.current) return;
      const price = seriesRef.current.coordinateToPrice(param.point.y);
      draggedLineRef.current.line.applyOptions({ price });
    };

    const onMouseUp = () => {
      if (!draggedLineRef.current) return;

      const newPrice = draggedLineRef.current.line.options().price;
      onLevelsChange({
        ...tradeLevels,
        [draggedLineRef.current.key]: newPrice,
      });

      draggedLineRef.current = null;
      chart.applyOptions({ handleScroll: true, handleScale: true });
    };

    chart.subscribeClick(onMouseDown);
    chart.subscribeCrosshairMove(onMouseMove);
    chart.subscribeClick(onMouseUp);

    const handleResize = () => chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.unsubscribeClick(onMouseDown);
      chart.unsubscribeCrosshairMove(onMouseMove);
      chart.unsubscribeClick(onMouseUp);
      chart.remove();
    };
  }, [chartData]);

  useEffect(() => {
    if (priceLinesRef.current.entry) {
      priceLinesRef.current.entry.applyOptions({ price: tradeLevels.entry });
    }
    if (priceLinesRef.current.takeProfit) {
      priceLinesRef.current.takeProfit.applyOptions({ price: tradeLevels.takeProfit });
    }
    if (priceLinesRef.current.stopLoss) {
      priceLinesRef.current.stopLoss.applyOptions({ price: tradeLevels.stopLoss });
    }
  }, [tradeLevels]);

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
        <div className={styles.intervalSelector}>
          <button onClick={() => setInterval('1m')}>1m</button>
          <button onClick={() => setInterval('15m')}>15m</button>
          <button onClick={() => setInterval('1h')}>1h</button>
          <button onClick={() => setInterval('1d')}>1d</button>
        </div>
        <div ref={chartContainerRef} className={styles.chartContainer} />
        <TradePanel tradeLevels={tradeLevels} onLevelsChange={onLevelsChange} />
        <CryptoList />
      </CardContent>
    </Card>
  );
});

TechnicalAnalysisChart.displayName = "TechnicalAnalysisChart";

export default TechnicalAnalysisChart;