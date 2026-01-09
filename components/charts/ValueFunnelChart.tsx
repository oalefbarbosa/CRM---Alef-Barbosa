
import React, { useCallback } from 'react';
import { useChart } from './BaseChart';
import { CrmData } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import type { ChartConfiguration, ChartData } from 'chart.js';

interface ValueFunnelChartProps {
  data: CrmData[];
}

const ValueFunnelChart: React.FC<ValueFunnelChartProps> = ({ data }) => {
  const processData = useCallback((crmData: CrmData[]) => {
    // This chart shows the sum of 'valor' for each specific status, not a cumulative funnel.
    const funnelOrder = ['em prospecção', 'reunião de proposta', 'em follow up', 'ganho'];
    
    const statusValueTotals = crmData.reduce((acc, lead) => {
        const status = lead.status;
        // Only accumulate for statuses we want to display
        if (funnelOrder.includes(status)) {
            acc[status] = (acc[status] || 0) + lead.valor;
        }
        return acc;
    }, {} as { [key: string]: number });
    
    return {
      labels: funnelOrder.map(s => s.replace(/\b\w/g, l => l.toUpperCase())),
      values: funnelOrder.map(s => statusValueTotals[s] || 0)
    };
  }, []);

  const configFactory = useCallback((): ChartConfiguration => {
    const { labels, values } = processData(data);

    const chartData: ChartData = {
      labels: labels,
      datasets: [{
        label: 'Valor',
        data: values,
        backgroundColor: '#a855f7',
        borderColor: '#c084fc',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7,
      }],
    };

    return {
      type: 'bar',
      data: chartData,
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Valor: ${formatCurrency(context.raw as number)}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#334155' },
            ticks: { 
              color: '#94a3b8',
              callback: (value) => formatCurrency(value as number)
            },
          },
          y: {
            grid: { display: false },
            ticks: { color: '#f8fafc' },
          },
        },
      },
    };
  }, [data, processData]);

  const canvasRef = useChart(configFactory, data);

  return <canvas ref={canvasRef} />;
};

export default ValueFunnelChart;