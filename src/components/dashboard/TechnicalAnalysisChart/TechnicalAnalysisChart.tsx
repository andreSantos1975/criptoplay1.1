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
  selectedCrypto: string;
  onCryptoSelect: (symbol: string) => void;
  marketType: 'spot' | 'futures';
  onMarketTypeChange: (marketType: 'spot' | 'futures') => void;
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
    const { data: exchangeRateData } = useQuery({
      queryKey: ["exchangeRate"],
      queryFn: async () => {
        const response = await fetch("/api/exchange-rate");
        if (!response.ok) throw new Error("Failed to fetch exchange rate");
        return response.json();
      },
      refetchInterval: 60000, // Refetch every minute
    });

    const { data: chartData, isLoading, error } = useQuery({
      queryKey: ["binanceKlines", marketType, interval, selectedCrypto, exchangeRateData], // Depend on exchangeRateData
      queryFn: async () => {
        const apiPath = marketType === 'futures' ? 'futures-klines' : 'klines';

        let symbolForApi = selectedCrypto;
        if (marketType === 'futures') {
          // Convert 'BTCUSDT' to 'BTCUSD_PERP' for COIN-M futures
          symbolForApi = selectedCrypto.replace('USDT', 'USD_PERP');
        }

        const response = await fetch(
          `/api/binance/${apiPath}?symbol=${symbolForApi}&interval=${interval}`
        );
        if (!response.ok) throw new Error("Network response was not ok");
        const data: BinanceKlineData[] = await response.json();
        
        const brlRate = exchangeRateData?.usdtToBrl || 1; // Default to 1 if rate not available

        return data.map((k) => ({
          time: (k[0] / 1000) as UTCTimestamp,
          open: parseFloat(k[1]) * brlRate,
          high: parseFloat(k[2]) * brlRate,
          low: parseFloat(k[3]) * brlRate,
          close: parseFloat(k[4]) * brlRate,
        }));
      },
      enabled: !!exchangeRateData, // Only run this query when exchange rate is available
      refetchInterval: 60000,
    });

    useEffect(() => {
      if (
        !chartContainerRef.current ||
        !chartData ||
        chartData.length === 0
      ) {
        return;
      }

      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#131722' },
          textColor: '#D9D9D9',
        },
        grid: {
          vertLines: { color: '#2A2E39' },
          horzLines: { color: '#2A2E39' },
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
        crosshair: { mode: CrosshairMode.Normal },
        handleScroll: true,
        handleScale: true,
      });
      chartRef.current = chart;

      const calculatePrecision = (price: number) => {
        if (price === 0) return 2;
        const priceString = price.toString();
        if (priceString.includes('.')) {
          const decimalPart = priceString.split('.')[1];
          let leadingZeros = 0;
          for (const char of decimalPart) {
            if (char === '0') {
              leadingZeros++;
            } else {
              break;
            }
          }
          return leadingZeros + 4;
        }
        return 2;
      };

      const firstPrice = chartData[0]?.close || 0;
      const precision = calculatePrecision(firstPrice);
      const minMove = 1 / Math.pow(10, precision);

      chart.applyOptions({
        localization: {
          priceFormatter: (price: number) => `R$ ${price.toFixed(precision)}`,
        },
      });

      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderUpColor: '#26a69a',
        borderDownColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        title: selectedCrypto,
        priceFormat: {
          type: 'price',
          precision: precision,
          minMove: minMove,
        },
      });
      candlestickSeries.setData(chartData);
      seriesRef.current[selectedCrypto] = candlestickSeries;

      const onClick = (param: MouseEventParams) => {
        const series = seriesRef.current[selectedCrypto];
        if (!series || !param.point) return;

        if (draggedLineRef.current) {
          const { key, line } = draggedLineRef.current;
          const brlRate = exchangeRateData?.usdtToBrl || 1;
          const priceInUSD = line.options().price / brlRate;
          onLevelsChange({
            ...latestTradeLevelsRef.current,
            [key]: priceInUSD,
          });
          draggedLineRef.current = null;
          chart.applyOptions({ handleScroll: true, handleScale: true });
          return;
        }

        const y = param.point.y;
        const priceAtCursor = series.coordinateToPrice(y);
        if (priceAtCursor == null) return;

        const pTop = series.coordinateToPrice(y - 6);
        const pBottom = series.coordinateToPrice(y + 6);
        if (pTop == null || pBottom == null) return;
        const tolerance = Math.abs(pTop - pBottom);

        (Object.keys(priceLinesRef.current) as PriceLineKey[]).forEach(
          (key) => {
            const line = priceLinesRef.current[key];
            if (!line) return;
            if (
              Math.abs(line.options().price - priceAtCursor) <= tolerance
            ) {
              draggedLineRef.current = { line, key };
              chart.applyOptions({
                handleScroll: false,
                handleScale: false,
              });
            }
          }
        );
      };

      const onCrosshairMove = (param: MouseEventParams) => {
        if (!draggedLineRef.current) return;
        const series = seriesRef.current[selectedCrypto];
        if (!series || !param.point) return;

        const price = series.coordinateToPrice(param.point.y);
        if (price != null) {
          draggedLineRef.current.line.applyOptions({ price });
        }
      };

      chart.subscribeClick(onClick);
      chart.subscribeCrosshairMove(onCrosshairMove);

      const handleResize = () => {
        chart.applyOptions({
          width: chartContainerRef.current?.clientWidth || 0,
        });
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.unsubscribeClick(onClick);
        chart.unsubscribeCrosshairMove(onCrosshairMove);
        chart.remove();
        chartRef.current = null;
        seriesRef.current = {};
        priceLinesRef.current = {};
      };
    }, [chartData, selectedCrypto, exchangeRateData, onLevelsChange]);

    useEffect(() => {
      const primarySeries = seriesRef.current[selectedCrypto];
      const brlRate = exchangeRateData?.usdtToBrl || 1;

      if (!primarySeries || !brlRate) return;

      const createOrUpdatePriceLine = (
        key: PriceLineKey,
        price: number,
        color: string,
        title: string
      ) => {
        const line = priceLinesRef.current[key];
        const newPrice = price * brlRate;
        if (line) {
          line.applyOptions({ price: newPrice });
        } else {
          priceLinesRef.current[key] = primarySeries.createPriceLine({
            price: newPrice,
            color,
            lineWidth: 2,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title,
          });
        }
      };

      const removePriceLine = (key: PriceLineKey) => {
        const line = priceLinesRef.current[key];
        if (line) {
          primarySeries.removePriceLine(line);
          delete priceLinesRef.current[key];
        }
      };

      // Always show entry line
      createOrUpdatePriceLine("entry", tradeLevels.entry, "#42A5F5", "Entrada");

      if (marketType === "futures") {
        // For futures, show take profit and stop loss
        createOrUpdatePriceLine(
          "takeProfit",
          tradeLevels.takeProfit,
          "#26A69A",
          "Take Profit"
        );
        createOrUpdatePriceLine(
          "stopLoss",
          tradeLevels.stopLoss,
          "#EF5350",
          "Stop Loss"
        );
      } else {
        // For spot, remove them if they exist
        removePriceLine("takeProfit");
        removePriceLine("stopLoss");
      }
    }, [tradeLevels, exchangeRateData, chartData, selectedCrypto, marketType]);

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
          <div className={styles.marketSelector}>
            <button
              onClick={() => onMarketTypeChange('spot')}
              className={marketType === 'spot' ? styles.active : ''}
            >
              Spot
            </button>
            <button
              onClick={() => onMarketTypeChange('futures')}
              className={marketType === 'futures' ? styles.active : ''}
            >
              Futuros
            </button>
          </div>
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