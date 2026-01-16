
// Fix: Import React to make the 'React' namespace available for types like 'React.RefObject'.
import React, { useEffect, useRef } from 'react';
import type { ChartConfiguration, Chart } from 'chart.js';

// Chart is loaded from CDN, so we declare it globally to satisfy TypeScript
declare const Chart: any;

export function useChart<T extends Chart>(
  configFactory: () => ChartConfiguration,
  data: any
): React.RefObject<HTMLCanvasElement> {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<T | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const config = configFactory();

    if (chartRef.current) {
      // Update existing chart
      chartRef.current.data = config.data;
      chartRef.current.options = config.options || {};
      chartRef.current.update();
    } else {
      // Create new chart
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        chartRef.current = new Chart(ctx, config) as T;
      }
    }

    // Cleanup on unmount
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data, configFactory]);

  return canvasRef;
}