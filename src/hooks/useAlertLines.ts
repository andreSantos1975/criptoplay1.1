"use client";

import { useEffect, useRef, useCallback } from 'react';
import { IChartApi, ISeriesApi, IPriceLine, LineStyle } from 'lightweight-charts';
import { Alert } from '@prisma/client';

interface UseAlertLinesProps {
  chartRef: React.RefObject<IChartApi | null>;
  seriesRef: React.RefObject<ISeriesApi<"Candlestick"> | null>;
  chartContainerRef: React.RefObject<HTMLDivElement>;
  isChartReady: boolean;
  staticAlerts: Alert[] | undefined;
  symbol: string;
  prospectiveAlert: { price: number } | null;
  onProspectiveAlertChange: (newAlert: { price: number }) => void;
}

const createLineOptions = (price: number, color: string, title: string, lineStyle = LineStyle.Dashed) => ({
  price,
  color,
  lineWidth: 2 as const,
  lineStyle,
  axisLabelVisible: true,
  title,
});

export const useAlertLines = ({
  chartRef,
  seriesRef,
  chartContainerRef,
  isChartReady,
  staticAlerts,
  symbol,
  prospectiveAlert,
  onProspectiveAlertChange,
}: UseAlertLinesProps) => {
  const staticLinesRef = useRef<Map<string, IPriceLine>>(new Map());
  const prospectiveLineRef = useRef<IPriceLine | null>(null);
  const isDragging = useRef(false);

  const onProspectiveAlertChangeRef = useRef(onProspectiveAlertChange);
  onProspectiveAlertChangeRef.current = onProspectiveAlertChange;

  const removeAllStaticLines = useCallback(() => {
    const series = seriesRef.current;
    if (series) {
      staticLinesRef.current.forEach(line => series.removePriceLine(line));
      staticLinesRef.current.clear();
    }
  }, [seriesRef]);

  // Effect to manage STATIC alert lines
  useEffect(() => {
    const series = seriesRef.current;
    if (!isChartReady || !series) {
      removeAllStaticLines();
      return;
    }

    const currentAlertIds = new Set<string>();
    staticAlerts?.forEach(alert => {
      const config = alert.config as { symbol?: string, price?: number };
      if (config.symbol === symbol && alert.status === 'active' && config.price) {
        currentAlertIds.add(alert.id);
        const price = config.price;
        const existingLine = staticLinesRef.current.get(alert.id);
        const options = createLineOptions(price, '#FFC107', `Alerta`, LineStyle.Solid);

        if (existingLine) {
          existingLine.applyOptions(options);
        } else {
          staticLinesRef.current.set(alert.id, series.createPriceLine(options));
        }
      }
    });

    staticLinesRef.current.forEach((line, id) => {
      if (!currentAlertIds.has(id)) {
        series.removePriceLine(line);
        staticLinesRef.current.delete(id);
      }
    });

  }, [isChartReady, staticAlerts, symbol, seriesRef, removeAllStaticLines]);

  // Effect to manage PROSPECTIVE (draggable) alert line
  useEffect(() => {
    const series = seriesRef.current;
    if (!isChartReady || !series) return;

    if (prospectiveAlert && prospectiveAlert.price > 0) {
      const lineOptions = createLineOptions(prospectiveAlert.price, '#FFEB3B', 'Novo Alerta');
      if (prospectiveLineRef.current) {
        prospectiveLineRef.current.applyOptions(lineOptions);
      } else {
        prospectiveLineRef.current = series.createPriceLine(lineOptions);
      }
    } else {
      if (prospectiveLineRef.current) {
        series.removePriceLine(prospectiveLineRef.current);
        prospectiveLineRef.current = null;
      }
    }
  }, [isChartReady, prospectiveAlert, seriesRef]);

  // Effect for DRAG AND DROP logic
  useEffect(() => {
    const chartElement = chartContainerRef.current;
    const chart = chartRef.current;
    const series = seriesRef.current;

    // Only attach listeners if there's a prospective line to drag
    if (!isChartReady || !chartElement || !chart || !series || !prospectiveAlert) return;

    const isNearPriceLine = (priceLine: IPriceLine, y: number) => {
      const priceY = series.priceToCoordinate(priceLine.options().price);
      return priceY !== null && Math.abs(priceY - y) < 10;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!prospectiveLineRef.current) return;
      const rect = chartElement.getBoundingClientRect();
      const y = e.clientY - rect.top;

      if (isNearPriceLine(prospectiveLineRef.current, y)) {
        isDragging.current = true;
        chart.applyOptions({ handleScroll: false, handleScale: false });
        chartElement.style.cursor = 'ns-resize';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !prospectiveLineRef.current) return;
      const rect = chartElement.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const newPrice = series.coordinateToPrice(y);

      if (newPrice !== null) {
        // Update the line visually in real-time
        prospectiveLineRef.current.applyOptions({ price: newPrice });
      }
    };

    const handleMouseUp = () => {
      if (!isDragging.current || !prospectiveLineRef.current) {
        return;
      }
      
      const finalPrice = prospectiveLineRef.current.options().price;
      isDragging.current = false;
      chart.applyOptions({ handleScroll: true, handleScale: true });
      chartElement.style.cursor = 'default';
      
      // Update the state in the parent component
      onProspectiveAlertChangeRef.current({ price: finalPrice });
    };

    chartElement.addEventListener('mousedown', handleMouseDown);
    chartElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      chartElement.removeEventListener('mousedown', handleMouseDown);
      chartElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      chart.applyOptions({ handleScroll: true, handleScale: true });
      chartElement.style.cursor = 'default';
    };
  }, [isChartReady, prospectiveAlert, chartRef, seriesRef, chartContainerRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      removeAllStaticLines();
      if (seriesRef.current && prospectiveLineRef.current) {
        seriesRef.current.removePriceLine(prospectiveLineRef.current);
      }
    };
  }, [removeAllStaticLines, seriesRef]);
};