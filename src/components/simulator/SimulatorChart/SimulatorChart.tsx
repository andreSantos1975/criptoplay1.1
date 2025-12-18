"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import {
  createChart, ColorType, CrosshairMode, ISeriesApi,
  IChartApi, BarData, CandlestickSeries
} from "lightweight-charts";
import { UseMutationResult } from "@tanstack/react-query"; // This import is no longer needed here but leaving it won't hurt
import styles from "./SimulatorChart.module.css";
import { useTradeLines } from "../../../hooks/useTradeLines";
import { useAlertLines } from "../../../hooks/useAlertLines";
import { Trade, Alert } from '@prisma/client';
import { Button } from '@/components/ui/button';

interface SimulatorChartProps {
  symbol: string;
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number };
  onLevelsChange: (levels: { entry: number; takeProfit: number; stopLoss: number; }) => void;
  tipoOperacao: 'compra' | 'venda' | '';
  initialChartData: BarData[] | undefined;
  isChartLoading: boolean;
  interval: string;
  onIntervalChange: (interval: string) => void;
  realtimeChartUpdate: BarData | null;
  openTrades: Trade[] | undefined;
  alerts: Alert[] | undefined;
  // New props for better UX
  prospectiveAlert: { price: number } | null;
  onProspectiveAlertChange: (newAlert: { price: number }) => void;
  onStartCreateAlert: () => void;
  onSaveAlert: () => void;
  onCancelCreateAlert: () => void;
}

export const SimulatorChart = memo(({ 
  symbol, 
  tradeLevels, 
  onLevelsChange, 
  tipoOperacao,
  initialChartData,
  isChartLoading,
  interval,
  onIntervalChange,
  realtimeChartUpdate,
  openTrades,
  alerts,
  prospectiveAlert,
  onProspectiveAlertChange,
  onStartCreateAlert,
  onSaveAlert,
  onCancelCreateAlert,
}: SimulatorChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  // Use the custom hook to draw and manage trade lines
  useTradeLines({
    chartRef,
    seriesRef,
    chartContainerRef,
    tradeLevels,
    onLevelsChange,
    isChartReady,
    marketType: 'spot',
    tipoOperacao: tipoOperacao,
    openTrades,
    symbol,
  });

  // Use the custom hook to draw and manage alert lines
  useAlertLines({
    chartRef,
    seriesRef,
    chartContainerRef,
    isChartReady,
    staticAlerts: alerts,
    symbol,
    prospectiveAlert,
    onProspectiveAlertChange,
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

    // --- Resize Observer ---
    const resizeObserver = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });

    resizeObserver.observe(chartElement);
    setIsChartReady(true);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      setIsChartReady(false);
    };
  }, []);

  // Load initial data
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    if (isChartLoading) {
      seriesRef.current.setData([]); // Clear chart data while fetching
    } else if (isChartReady && initialChartData) {
      seriesRef.current.setData(initialChartData);
      chartRef.current.timeScale().fitContent();
    }
  }, [isChartReady, initialChartData, isChartLoading]);

  // Effect to handle real-time updates from WebSocket
  useEffect(() => {
    if (seriesRef.current && realtimeChartUpdate) {
      seriesRef.current.update(realtimeChartUpdate);
    }
  }, [realtimeChartUpdate]);

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
    
  return (
    <div>
      <div className={styles.chartHeader}>
        <h2 className={styles.title}>Gráfico de Preços: {symbol}</h2>
        <div className={styles.intervalSelector}>
          {["1m", "15m", "1h", "1d"].map(int => (
            <button 
              key={int} 
              onClick={() => onIntervalChange(int)} 
              className={interval === int ? styles.active : ""}
              disabled={isChartLoading}
            >
              {int}
            </button>
          ))}
        </div>
        <div className={styles.alertControls}>
          {prospectiveAlert ? (
            <>
              <Button onClick={onSaveAlert} variant="default" size="sm">
                Salvar Alerta
              </Button>
              <Button onClick={onCancelCreateAlert} variant="ghost" size="sm">
                Cancelar
              </Button>
            </>
          ) : (
            <Button onClick={onStartCreateAlert} variant="outline" size="sm">
              Criar Alerta
            </Button>
          )}
        </div>
      </div>
      <div ref={chartContainerRef} className={styles.chartContainer} />
    </div>
  );
});

SimulatorChart.displayName = "SimulatorChart";
export default SimulatorChart;
