"use client";

import React, { useEffect, useRef, memo, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  ISeriesApi,
  IPriceLine,
  CandlestickSeries, // ✅ importa o construtor de série
  UTCTimestamp,
  IChartApi,
} from "lightweight-charts";
import { useQuery } from "@tanstack/react-query";
import styles from "./TechnicalAnalysisChart.module.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarketData } from "@/components/dashboard/MarketData/MarketData";
import { CryptoList } from "@/components/dashboard/CryptoList/CryptoList";
import { TradePanel } from "@/components/dashboard/TradePanel/TradePanel";

type PriceLineKey = "entry" | "takeProfit" | "stopLoss";
type MarketType = "spot" | "futures";

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
  string // Ignore
];

interface TechnicalAnalysisChartProps {
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number };
  onLevelsChange: (newLevels: {
    entry: number;
    takeProfit: number;
    stopLoss: number;
  }) => void;
  children: React.ReactNode;
  selectedCrypto: string;
  onCryptoSelect: (symbol: string) => void;
  marketType: MarketType;
  onMarketTypeChange: (market: MarketType) => void;
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
  }: TechnicalAnalysisChartProps) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const priceLinesRef = useRef<Partial<Record<PriceLineKey, IPriceLine>>>({});
    const [draggingLine, setDraggingLine] = useState<PriceLineKey | null>(null);
    const [interval, setInterval] = useState("1d");
    const [newSymbolInput, setNewSymbolInput] = useState("");
    const [watchedSymbols, setWatchedSymbols] = useState<string[]>([
      "BTCUSDT",
      "ETHUSDT",
      "SOLUSDT",
      "XRPUSDT",
      "ADAUSDT",
      "BNBUSDT",
      "DOGEUSDT",
      "SHIBUSDT",
    ]);

    const { data: exchangeRateData } = useQuery({
      queryKey: ["exchangeRate"],
      queryFn: async () => {
        const response = await fetch("/api/exchange-rate");
        if (!response.ok) throw new Error("Failed to fetch exchange rate");
        return response.json();
      },
      refetchInterval: 60000,
    });

    const tradeLevelsRef = useRef(tradeLevels);
    const brlRateRef = useRef(1);

    useEffect(() => {
      tradeLevelsRef.current = tradeLevels;
    }, [tradeLevels]);

    useEffect(() => {
      brlRateRef.current = exchangeRateData?.usdtToBrl || 1;
    }, [exchangeRateData]);

    const { data: chartData, isLoading, error } = useQuery({
      queryKey: ["klines", marketType, interval, selectedCrypto, exchangeRateData],
      queryFn: async () => {
        const apiEndpoint =
          marketType === "spot"
            ? "/api/binance/klines"
            : "/api/binance/futures-klines";
        const symbol =
          marketType === "futures"
            ? selectedCrypto.replace(/USDT$/, "USD_PERP")
            : selectedCrypto;

        const response = await fetch(
          `${apiEndpoint}?symbol=${symbol}&interval=${interval}`
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const data: BinanceKlineData[] = await response.json();

        const brlRate = exchangeRateData?.usdtToBrl || 1;

        return data.map((k) => ({
          time: (k[0] / 1000) as UTCTimestamp,
          open: parseFloat(k[1]) * brlRate,
          high: parseFloat(k[2]) * brlRate,
          low: parseFloat(k[3]) * brlRate,
          close: parseFloat(k[4]) * brlRate,
        }));
      },
      enabled: !!exchangeRateData,
      refetchInterval: 60000,
    });

    const handleAddSymbol = (symbolToAdd?: string) => {
      const symbol = (symbolToAdd || newSymbolInput.trim()).toUpperCase();
      if (symbol && !watchedSymbols.includes(symbol)) {
        setWatchedSymbols((prev) => [...prev, symbol]);
        if (!symbolToAdd) setNewSymbolInput("");
      }
    };

    // Encapsulate price-to-Y conversion
    const priceToY = useCallback((price: number) => {
      if (!chartRef.current || !seriesRef.current) return 0;
      return seriesRef.current.priceToCoordinate(price) ?? 0; // ✅ garante number
    }, []);

    // Encapsulate Y-to-price conversion
    const yToPrice = useCallback((y: number) => {
      if (!chartRef.current || !seriesRef.current) return 0;
      return seriesRef.current.coordinateToPrice(y) ?? 0;
    }, []);

    useEffect(() => {
      if (
        !chartContainerRef.current ||
        !chartData ||
        chartData.length === 0 ||
        !exchangeRateData
      ) {
        return;
      }

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#131722" },
          textColor: "#D9D9D9",
        },
        grid: { vertLines: { color: "#2A2E39" }, horzLines: { color: "#2A2E39" } },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        crosshair: { mode: CrosshairMode.Normal },
      });
      chartRef.current = chart;

      const firstPrice = chartData[0]?.close || 0;
      const precision = firstPrice < 1 ? 4 : 2;

      chart.applyOptions({
        localization: {
          priceFormatter: (price: number) => `R$ ${price.toFixed(precision)}`,
        },
      });

      // ✅ API nova: use addSeries(CandlestickSeries, options)
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });
      candlestickSeries.setData(chartData);
      seriesRef.current = candlestickSeries;

      const brlRate = exchangeRateData.usdtToBrl || 1;

      const createOrUpdatePriceLine = (
        key: PriceLineKey,
        price: number,
        color: string,
        title: string
      ) => {
        if (priceLinesRef.current[key]) {
          priceLinesRef.current[key]?.applyOptions({ price, color, title });
        } else {
          priceLinesRef.current[key] = candlestickSeries.createPriceLine({
            price,
            color,
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title,
          });
        }
      };

      if (marketType === "futures") {
        createOrUpdatePriceLine(
          "entry",
          tradeLevels.entry * brlRate,
          "#42A5F5",
          "Entrada"
        );
        createOrUpdatePriceLine(
          "takeProfit",
          tradeLevels.takeProfit * brlRate,
          "#26A69A",
          "Take Profit"
        );
        createOrUpdatePriceLine(
          "stopLoss",
          tradeLevels.stopLoss * brlRate,
          "#EF5350",
          "Stop Loss"
        );
      }

      // --- Dragging Logic ---
      const container = chartContainerRef.current;

      const handleMouseDown = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const y = event.clientY - rect.top;

        const currentTradeLevels = tradeLevelsRef.current;
        const currentBrlRate = brlRateRef.current;

        const takeProfitY = priceToY(currentTradeLevels.takeProfit * currentBrlRate);
        const stopLossY = priceToY(currentTradeLevels.stopLoss * currentBrlRate);

        if (Math.abs(y - takeProfitY) < 10) {
          setDraggingLine("takeProfit");
        } else if (Math.abs(y - stopLossY) < 10) {
          setDraggingLine("stopLoss");
        }
      };

      const handleMouseMove = (event: MouseEvent) => {
        if (!draggingLine) return;

        const rect = container.getBoundingClientRect();
        const y = event.clientY - rect.top;
        const newPrice = yToPrice(y);

        if (newPrice !== null && newPrice > 0) {
          const newPriceInUSD = newPrice / brlRateRef.current;
          onLevelsChange({ ...tradeLevelsRef.current, [draggingLine]: newPriceInUSD });
        }
      };

      const handleMouseUp = () => {
        setDraggingLine(null);
      };

      container.addEventListener("mousedown", handleMouseDown);
      container.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      const handleResize = () =>
        chart.applyOptions({ width: container.clientWidth });
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        container.removeEventListener("mousedown", handleMouseDown);
        container.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
        seriesRef.current = null;
        priceLinesRef.current = {};
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartData, selectedCrypto, exchangeRateData, marketType]);

    // Atualiza linhas de preço quando tradeLevels/exchangeRateData mudam
    useEffect(() => {
      if (!seriesRef.current || !exchangeRateData || marketType !== "futures") {
        return;
      }

      const brlRate = exchangeRateData.usdtToBrl || 1;

      const createOrUpdatePriceLine = (
        key: PriceLineKey,
        price: number,
        color: string,
        title: string
      ) => {
        if (priceLinesRef.current[key]) {
          priceLinesRef.current[key]?.applyOptions({ price, color, title });
        } else {
          if (seriesRef.current) {
            priceLinesRef.current[key] = seriesRef.current.createPriceLine({
              price,
              color,
              lineWidth: 2,
              lineStyle: LineStyle.Dashed,
              axisLabelVisible: true,
              title,
            });
          }
        }
      };

      createOrUpdatePriceLine(
        "entry",
        tradeLevels.entry * brlRate,
        "#42A5F5",
        "Entrada"
      );
      createOrUpdatePriceLine(
        "takeProfit",
        tradeLevels.takeProfit * brlRate,
        "#26A69A",
        "Take Profit"
      );
      createOrUpdatePriceLine(
        "stopLoss",
        tradeLevels.stopLoss * brlRate,
        "#EF5350",
        "Stop Loss"
      );
    }, [tradeLevels, exchangeRateData, seriesRef, marketType]);

    if (isLoading) return <div>Loading chart...</div>;
    if (error) return <div>Error fetching chart data</div>;

    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Análise Técnica - {selectedCrypto} (Binance)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.marketSelector}>
            <button
              onClick={() => onMarketTypeChange("spot")}
              className={marketType === "spot" ? styles.active : ""}
            >
              Spot
            </button>
            <button
              onClick={() => onMarketTypeChange("futures")}
              className={marketType === "futures" ? styles.active : ""}
            >
              Futuros
            </button>
          </div>
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
          <div
            ref={chartContainerRef}
            className={styles.chartContainer}
            style={{ cursor: draggingLine ? "grabbing" : "default" }}
          />
          <TradePanel
            tradeLevels={tradeLevels}
            onLevelsChange={onLevelsChange}
            marketType={marketType}
          />
          {children}
          <div className={styles.addSymbolContainer}>
            <input
              type="text"
              placeholder="Add symbol (e.g., ETHUSDT)"
              value={newSymbolInput}
              onChange={(e) => setNewSymbolInput(e.target.value)}
              className={styles.symbolInput}
            />
            <button
              onClick={() => handleAddSymbol()}
              className={styles.addSymbolButton}
            >
              Add Crypto
            </button>
          </div>
          <CryptoList
            watchedSymbols={watchedSymbols}
            onCryptoSelect={onCryptoSelect}
          />
        </CardContent>
      </Card>
    );
  }
);

TechnicalAnalysisChart.displayName = "TechnicalAnalysisChart";
export default TechnicalAnalysisChart;
