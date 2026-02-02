"use client";

import React, { useEffect, useRef, memo, useState } from "react";
import {
  createChart, ColorType, CrosshairMode, ISeriesApi,
  IChartApi, BarData, CandlestickSeries
} from "lightweight-charts";
import styles from "./SimulatorChart.module.css";
import { useTradeLines } from "../../../hooks/useTradeLines";
import { useAlertLines } from "../../../hooks/useAlertLines";
import { Trade, Alert } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface SimulatorChartProps {
  symbol: string;
  marketType: 'spot' | 'futures';
  tradeLevels: { entry: number; takeProfit: number; stopLoss: number };
  onLevelsChange: (levels: { entry: number; takeProfit: number; stopLoss: number; }) => void;
  tipoOperacao: 'compra' | 'venda' | '';
  initialChartData: BarData[] | undefined;
  isChartLoading: boolean;
  interval: string;
  onIntervalChange: (interval: string) => void;
  realtimeChartUpdate: BarData | null;
  openPositions: any[] | undefined;
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
  marketType,
  tradeLevels, 
  onLevelsChange, 
  tipoOperacao,
  initialChartData,
  isChartLoading,
  interval,
  onIntervalChange,
  realtimeChartUpdate,
  openPositions,
  alerts,
  prospectiveAlert,
  onProspectiveAlertChange,
  onStartCreateAlert,
  onSaveAlert,
  onCancelCreateAlert,
}: SimulatorChartProps) => {
  const { data: session } = useSession();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [isChartReady, setIsChartReady] = useState(false);
  const isInitialLoad = useRef(true);

  // Verifica se o período de trial ainda está ativo
  const isTrialActive = session?.user?.trialEndsAt ? new Date(session.user.trialEndsAt) > new Date() : false;

  // Verifica se o usuário tem acesso ao gráfico com base na assinatura ou trial
  const hasAccess = 
    session?.user?.isAdmin || 
    session?.user?.subscriptionStatus === 'authorized' || 
    session?.user?.subscriptionStatus === 'lifetime' ||
    isTrialActive;

  // Use the custom hook to draw and manage trade lines
  useTradeLines({
    chartRef,
    seriesRef,
    chartContainerRef,
    tradeLevels,
    onLevelsChange,
    isChartReady,
    marketType: marketType, // Corrigido
    tipoOperacao: tipoOperacao,
    openPositions,
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
    // Se não tiver acesso, nem tenta criar o gráfico
    if (!hasAccess) return;

    const chartElement = chartContainerRef.current;
    if (!chartElement) return;

    const chart = createChart(chartElement, {
      layout: { background: { type: ColorType.Solid, color: "#131722" }, textColor: "#D9D9D9" },
      grid: { vertLines: { color: "#2A2E39" }, horzLines: { color: "#2A2E39" } },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      }
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
      isInitialLoad.current = true; // Reset for next chart instance
    };
  }, [symbol, hasAccess, interval]); // Dependências simplificadas

  // Load initial data
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || !isChartReady) return;
  
    if (isChartLoading) {
      seriesRef.current.setData([]); // Limpa os dados enquanto carrega
      isInitialLoad.current = true; // Reseta para a proxima carga de dados
    } else if (initialChartData && Array.isArray(initialChartData)) {
      // A API da Binance já retorna os dados ordenados, então a ordenação no cliente é removida
      // para evitar possíveis erros com formatos de timestamp.
      seriesRef.current.setData(initialChartData);
      
      // Apenas faz o fitContent na carga inicial para não perder o zoom/posição do usuário
      if (isInitialLoad.current && initialChartData.length > 0) {
        chartRef.current.timeScale().fitContent();
        isInitialLoad.current = false;
      }
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

  // Se não tiver acesso, renderiza o overlay de bloqueio
  if (!hasAccess) {
    const trialEnded = session?.user?.trialEndsAt && new Date(session.user.trialEndsAt) <= new Date();
    return (
      <div className={styles.lockedChartContainer}>
        <div className={styles.lockedContent}>
          <div className={styles.lockedIcon}>🔒</div>
          <h3 className={styles.lockedTitle}>Gráfico de Análise Técnica (Premium)</h3>
          <p className={styles.lockedText}>
            {trialEnded
              ? "Seu período de teste Premium gratuito terminou. Assine um plano para continuar usando este recurso avançado."
              : "Este recurso avançado é exclusivo para assinantes Starter, Pro ou Premium."
            }
          </p>
          <Link href="/assinatura" className={styles.upgradeButton}>
            Ver Planos
          </Link>
        </div>
      </div>
    );
  }
    
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
              <Button onClick={onCancelCreateAlert} variant="ghost" size="sm" className={styles.cancelAlertBtn}>
                Cancelar
              </Button>
            </>
          ) : (
            <Button onClick={onStartCreateAlert} variant="outline" size="sm" className={styles.createAlertBtn}>
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