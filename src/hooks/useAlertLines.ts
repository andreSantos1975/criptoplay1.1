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
      if (config.symbol === symbol && alert.status === 'ACTIVE' && config.price) {
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

    if (!isChartReady || !chartElement || !chart || !series || !prospectiveAlert) return;

    const isNearPriceLine = (priceLine: IPriceLine, y: number) => {
      const priceY = series.priceToCoordinate(priceLine.options().price);
      return priceY !== null && Math.abs(priceY - y) < 20; // Increased tolerance for touch
    };

    const handleDragStart = (y: number) => {
      if (!prospectiveLineRef.current) return;
      if (isNearPriceLine(prospectiveLineRef.current, y)) {
        isDragging.current = true;
        chart.applyOptions({ handleScroll: false, handleScale: false });
        chartElement.style.cursor = 'ns-resize';
      }
    };
    
    const handleDragMove = (y: number) => {
      if (!isDragging.current || !prospectiveLineRef.current) return;
      const newPrice = series.coordinateToPrice(y);

      if (newPrice !== null) {
        prospectiveLineRef.current.applyOptions({ price: newPrice });
      }
    };
    
    const handleDragEnd = () => {
      if (!isDragging.current || !prospectiveLineRef.current) return;
      
      const finalPrice = prospectiveLineRef.current.options().price;
      isDragging.current = false;
      chart.applyOptions({ handleScroll: true, handleScale: true });
      chartElement.style.cursor = 'default';
      
      onProspectiveAlertChangeRef.current({ price: finalPrice });
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = chartElement.getBoundingClientRect();
      handleDragStart(e.clientY - rect.top);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const rect = chartElement.getBoundingClientRect();
      handleDragMove(e.clientY - rect.top);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = chartElement.getBoundingClientRect();
        handleDragStart(e.touches[0].clientY - rect.top);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      if (e.touches.length > 0) {
        e.preventDefault(); // Prevent scrolling while dragging
        const rect = chartElement.getBoundingClientRect();
        handleDragMove(e.touches[0].clientY - rect.top);
      }
    };

    const handleTouchEnd = () => {
      handleDragEnd();
    };

    chartElement.addEventListener('mousedown', handleMouseDown);
    chartElement.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    chartElement.addEventListener('touchstart', handleTouchStart);
    chartElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      chartElement.removeEventListener('mousedown', handleMouseDown);
      chartElement.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      chartElement.removeEventListener('touchstart', handleTouchStart);
      chartElement.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (chart) {
        chart.applyOptions({ handleScroll: true, handleScale: true });
      }
      if (chartElement) {
        chartElement.style.cursor = 'default';
      }
    };
  }, [isChartReady, prospectiveAlert, chartRef, seriesRef, chartContainerRef]);

  // Cleanup on unmount
  useEffect(() => {
    const series = seriesRef.current;
    return () => {
      removeAllStaticLines();
      if (series && prospectiveLineRef.current) {
        series.removePriceLine(prospectiveLineRef.current);
      }
    };
  }, [removeAllStaticLines, seriesRef]);
};