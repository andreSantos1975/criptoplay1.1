'use client';

import React, { useEffect, useRef, memo } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { AreaSeries } from 'lightweight-charts';
import styles from './TechnicalAnalysisChart.module.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Placeholder data for demonstration
const initialData = [
  { time: '2023-01-01', value: 45000 },
  { time: '2023-01-02', value: 45500 },
  { time: '2023-01-03', value: 44800 },
  { time: '2023-01-04', value: 46200 },
  { time: '2023-01-05', value: 47100 },
  { time: '2023-01-06', value: 46800 },
  { time: '2023-01-07', value: 48200 },
  { time: '2023-01-08', value: 47900 },
  { time: '2023-01-09', value: 49000 },
  { time: '2023-01-10', value: 48500 },
];

export const TechnicalAnalysisChart = memo(() => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current!.clientWidth });
    };

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    chart.timeScale().fitContent();

    const newSeries = chart.addSeries(LightweightCharts.AreaSeries, {
      lineColor: 'hsl(var(--chart-green))',
      topColor: 'rgba(38, 166, 154, 0.28)',
      bottomColor: 'rgba(38, 166, 154, 0.05)',
    });

    newSeries.setData(initialData);

    // Example of adding a price line (e.g., for Stop Loss)
    const stopLossPrice = 46000;
    const stopLossLine = newSeries.createPriceLine({
      price: stopLossPrice,
      color: 'red',
      lineWidth: 2,
      lineStyle: 2, // LineStyle.Dashed
      axisLabelVisible: true,
      title: 'Stop Loss',
    });

    // Example of adding another price line (e.g., for Take Profit)
    const takeProfitPrice = 48500;
    const takeProfitLine = newSeries.createPriceLine({
      price: takeProfitPrice,
      color: 'green',
      lineWidth: 2,
      lineStyle: 2, // LineStyle.Dashed
      axisLabelVisible: true,
      title: 'Take Profit',
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gráfico de Análise Técnica - BTC/USD</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={chartContainerRef} className={styles.chartContainer} style={{ height: '300px' }}>
          {/* Chart will be rendered here by lightweight-charts */}
        </div>
        {/* Existing metrics grid, assuming it's still relevant */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <p className={styles.metricLabel}>Preço Atual</p>
            <p className={`${styles.metricValue} ${styles.positiveValue}`}>$47.900</p>
          </div>
          <div className={styles.metricItem}>
            <p className={styles.metricLabel}>Variação 24h</p>
            <p className={`${styles.metricValue} ${styles.positiveValue}`}>+2.5%</p>
          </div>
          <div className={styles.metricItem}>
            <p className={styles.metricLabel}>Volume</p>
            <p className={styles.metricValue}>1.9K</p>
          </div>
          <div className={styles.metricItem}>
            <p className={styles.metricLabel}>RSI</p>
            <p className={styles.metricValue}>65.2</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

TechnicalAnalysisChart.displayName = 'TechnicalAnalysisChart';