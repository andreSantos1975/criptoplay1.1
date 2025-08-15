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
} from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import styles from "./TechnicalAnalysisChart.module.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketData } from "@/components/dashboard/MarketData/MarketData";
import { CryptoList } from "@/components/dashboard/CryptoList/CryptoList";
import { TradePanel } from "@/components/dashboard/TradePanel/TradePanel";

type PriceLineKey = "entry" | "takeProfit" | "stopLoss";

interface BinanceKlineData extends Array<string | number> {
  0: number; // timestamp
  1: string; // open
  2: string; // high
  3: string; // low
  4: string; // close
}

const fetchBinanceKlines = async (interval: string) => {
  const response = await fetch(
    `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=365`
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
};

interface TechnicalAnalysisChartProps {
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number };
  onLevelsChange: (newLevels: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
  }) => void;
}

export const TechnicalAnalysisChart = memo(
  ({ tradeLevels, onLevelsChange }: TechnicalAnalysisChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const priceLinesRef = useRef<Partial<Record<PriceLineKey, IPriceLine>>>({});
    const draggedLineRef = useRef<{ line: IPriceLine; key: PriceLineKey } | null>(null);
    const [interval, setInterval] = useState("1d");

    const latestTradeLevelsRef = useRef(tradeLevels);
    useEffect(() => {
      latestTradeLevelsRef.current = tradeLevels;
    }, [tradeLevels]);

    const { data: chartData, isLoading, error } = useQuery({
      queryKey: ["binanceKlines", interval],
      queryFn: () => fetchBinanceKlines(interval),
      refetchInterval: 60000,
    });

    useEffect(() => {
      if (!chartContainerRef.current || !chartData) return;

      const chart = createChart(chartContainerRef.current, {
        layout: { background: { type: ColorType.Solid, color: "#131722" }, textColor: "#D9D9D9" },
        grid: { vertLines: { color: "#2A2E39" }, horzLines: { color: "#2A2E39" } },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        crosshair: { mode: CrosshairMode.Normal },
        handleScroll: true,
        handleScale: true,
      });

      // v5: criar via addSeries(CandlestickSeries, options)
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderUpColor: "#26a69a",
        borderDownColor: "#ef5350",
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
        // opcional: borderVisible: true,
      });

      seriesRef.current = candlestickSeries;
      candlestickSeries.setData(chartData);

      const createPriceLine = (price: number, color: string, title: string) =>
        candlestickSeries.createPriceLine({
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

      // Click para "pegar/soltar" a linha + mover com o crosshair
      const onClick = (param: MouseEventParams) => {
        const series = seriesRef.current;
        if (!series || !param.point) return;

        // já estava arrastando -> solta e confirma
        if (draggedLineRef.current) {
          const { key, line } = draggedLineRef.current;
          onLevelsChange({ ...latestTradeLevelsRef.current, [key]: line.options().price });
          draggedLineRef.current = null;
          chart.applyOptions({ handleScroll: true, handleScale: true });
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
            chart.applyOptions({ handleScroll: false, handleScale: false });
          }
        });
      };

      const onCrosshairMove = (param: MouseEventParams) => {
        if (!draggedLineRef.current) return;
        const series = seriesRef.current;
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
        chart.unsubscribeClick(onClick);
        chart.unsubscribeCrosshairMove(onCrosshairMove);
        chart.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartData]);

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
          <CardTitle>Análise Técnica - BTC/USDT (Binance)</CardTitle>
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
          <CryptoList />
        </CardContent>
      </Card>
    );
  }
);

TechnicalAnalysisChart.displayName = "TechnicalAnalysisChart";
export default TechnicalAnalysisChart;
