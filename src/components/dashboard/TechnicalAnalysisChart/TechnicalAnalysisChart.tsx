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
      "BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT",
      "ADAUSDT", "BNBUSDT", "DOGEUSDT", "SHIBUSDT",
    ]);

    const handleAddSymbol = (symbolToAdd?: string) => {
      const symbol = symbolToAdd || newSymbolInput.trim();
      if (symbol === "") return;
      const formattedSymbol = symbol.toUpperCase();
      if (!watchedSymbols.includes(formattedSymbol)) {
        setWatchedSymbols((prev) => [...prev, formattedSymbol]);
        if (!symbolToAdd) setNewSymbolInput("");
      }
    };

    const { data: exchangeRateData } = useQuery({
      queryKey: ["exchangeRate"],
      queryFn: async () => {
        const response = await fetch("/api/exchange-rate");
        if (!response.ok) throw new Error("Failed to fetch exchange rate");
        return response.json();
      },
      refetchInterval: 60000,
    });

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

    // 1. Create chart and series instance
    useEffect(() => {
      if (!chartContainerRef.current) return;

      const chart = createChart(chartContainerRef.current, {
        layout: { background: { type: ColorType.Solid, color: "#131722" }, textColor: "#D9D9D9" },
        grid: { vertLines: { color: "#2A2E39" }, horzLines: { color: "#2A2E39" } },
        width: chartContainerRef.current.clientWidth, height: 400, crosshair: { mode: CrosshairMode.Normal },
      });
      chartRef.current = chart;
      seriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a", downColor: "#ef5350", borderUpColor: "#26a69a",
        borderDownColor: "#ef5350", wickUpColor: "#26a69a", wickDownColor: "#ef5350",
      });

      const handleResize = () => chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
      window.addEventListener("resize", handleResize);
      setIsChartReady(true);

      return () => {
        window.removeEventListener("resize", handleResize);
        chart.remove();
        setIsChartReady(false);
      };
    }, []);

    // 2. Load initial data (in USD)
    useEffect(() => {
      if (!isChartReady || !seriesRef.current || !initialChartData) return;
      seriesRef.current.setData(initialChartData);
    }, [isChartReady, initialChartData]);

    // 3. Apply BRL formatting and update it when rate changes
    useEffect(() => {
      const chart = chartRef.current;
      const brlRate = exchangeRateData?.usdtToBrl || 1;
      if (!chart || !brlRate || !initialChartData) return;

      const firstPrice = initialChartData[0]?.close || 0;
      const precision = firstPrice < 1 ? 4 : 2; // USD precision

      chart.applyOptions({
        localization: {
          priceFormatter: (price: number) => `R$ ${(price * brlRate).toFixed(precision)}`,
        },
      });
    }, [exchangeRateData, initialChartData]);

    // 4. Connect WebSocket for real-time updates
    useEffect(() => {
      if (!isChartReady || !seriesRef.current || !selectedCrypto) return;

      let wsUrl;
      if (marketType === 'spot') {
        const symbol = selectedCrypto.toLowerCase();
        wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;
      } else { // futures
        const symbol = selectedCrypto.toLowerCase();
        wsUrl = `wss://fstream.binance.com/ws/${symbol}@kline_${interval}`;
      }

      console.log(`Attempting to connect to WebSocket: ${wsUrl}`); // Debugging line

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected to', wsUrl);
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const kline = message.k;
        if (kline) {
          seriesRef.current?.update({ time: kline.t / 1000, open: parseFloat(kline.o), high: parseFloat(kline.h), low: parseFloat(kline.l), close: parseFloat(kline.c) } as BarData);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket error:", event);
      };

      ws.onclose = (event) => {
        // Normal closure by the client will often have code 1000
        if (event.code !== 1000) {
          console.warn("WebSocket disconnected:", event.reason, "Code:", event.code);
        } else {
          console.log("WebSocket connection closed normally.");
        }
      };

      // Cleanup function to close the WebSocket connection when the component unmounts or dependencies change
      return () => {
        if (ws) {
          console.log("Closing WebSocket connection for", wsUrl);
          ws.onopen = null;
          ws.onmessage = null;
          ws.onerror = null;
          ws.onclose = null;
          ws.close(1000, "Component unmounting or dependency changing");
        }
      };
    }, [isChartReady, selectedCrypto, interval, marketType]);

    // 5. Update Price Lines
    useEffect(() => {
      const series = seriesRef.current;
      if (!series || !tradeLevels) return;

      Object.values(priceLinesRef.current).forEach(line => line && series.removePriceLine(line));
      priceLinesRef.current = {};

      const createPriceLine = (key: PriceLineKey, price: number, color: string, title: string) => {
        if (price > 0) {
          priceLinesRef.current[key] = series.createPriceLine({ price, color, lineWidth: 2, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title });
        }
      };

      createPriceLine("entry", tradeLevels.entry, "#42A5F5", "Entrada");
      if (marketType === 'futures' || (marketType === 'spot' && tipoOperacao === 'compra')) {
        createPriceLine("takeProfit", tradeLevels.takeProfit, "#26A69A", "Take Profit");
        createPriceLine("stopLoss", tradeLevels.stopLoss, "#EF5350", "Stop Loss");
      }
    }, [tradeLevels, tipoOperacao, initialChartData, exchangeRateData, marketType]); // Re-draw when symbol or rate changes

    return (
      <Card>
        <CardHeader><CardTitle>Análise Técnica - {selectedCrypto} (Binance)</CardTitle></CardHeader>
        <CardContent>
          <MarketData />
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

