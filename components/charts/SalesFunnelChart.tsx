
import React, { useCallback } from 'react';
import { useChart } from './BaseChart';
import { CrmData } from '../../types';
import type { ChartConfiguration, ChartData } from 'chart.js';

interface SalesFunnelChartProps {
  data: CrmData[];
}

const SalesFunnelChart: React.FC<SalesFunnelChartProps> = ({ data }) => {

  const processData = useCallback((crmData: CrmData[]) => {
    const funnelOrder = ['leads', 'em prospecção', 'reunião de proposta', 'em follow up', 'ganho'];
    // Create a map for status -> index for efficient lookup
    const funnelOrderIndexes = new Map(funnelOrder.map((status, index) => [status, index]));
    
    const counts = Array(funnelOrder.length).fill(0);

    // This is a cumulative funnel, so a lead in a later stage counts for all previous stages.
    for (const lead of crmData) {
        const index = funnelOrderIndexes.get(lead.status);
        if (index !== undefined) {
            // A lead at index 2 ('reunião de proposta') contributes to counts[0] through counts[2].
            for (let i = 0; i <= index; i++) {
                counts[i]++;
            }
        }
    }
    
    // As all active leads are counted, the first stage 'leads' will equal total length.
    // This override ensures correctness if any unknown statuses exist.
    counts[0] = crmData.length;
    
    return {
        labels: funnelOrder.map(s => s.replace(/\b\w/g, l => l.toUpperCase())),
        counts: counts
    };
  }, []);

  const configFactory = useCallback((): ChartConfiguration => {
    const { labels, counts } = processData(data);

    const chartData: ChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Leads',
          data: counts,
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, context.chart.width, 0);
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#22c55e');
            return gradient;
          },
          borderColor: '#334155',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.7,
        },
      ],
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
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: '#334155',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { color: '#334155' },
            ticks: { color: '#94a3b8' },
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

export default SalesFunnelChart;