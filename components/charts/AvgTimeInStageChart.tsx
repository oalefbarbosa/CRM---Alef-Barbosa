
import React, { useCallback } from 'react';
import { useChart } from './BaseChart';
import { CrmData } from '../../types';
import type { ChartConfiguration, ChartData } from 'chart.js';

interface AvgTimeInStageChartProps {
  data: CrmData[];
}

const AvgTimeInStageChart: React.FC<AvgTimeInStageChartProps> = ({ data }) => {

  const processData = useCallback((crmData: CrmData[]) => {
    // Define a logical order for funnel stages to ensure consistent display
    const STAGE_ORDER = [
      'em prospecção',
      'reunião de proposta',
      'em follow up',
      'em negociação',
      'ganho',
      'perdido'
    ];
    
    const stageTimes: { [key: string]: { totalDays: number; count: number } } = {};

    crmData.forEach(lead => {
      const timeDiff = lead.dataAtualizacao.getTime() - lead.dataCriacao.getTime();
      const days = Math.max(0, timeDiff / (1000 * 3600 * 24)); // Ensure non-negative days
      const status = lead.status;

      if (!stageTimes[status]) {
        stageTimes[status] = { totalDays: 0, count: 0 };
      }
      stageTimes[status].totalDays += days;
      stageTimes[status].count++;
    });

    // Map the calculated averages to the fixed order and filter out stages with no data
    const avgTimes = STAGE_ORDER
      .map(status => {
        const data = stageTimes[status];
        if (!data) return null; // Stage might not have any leads in the current dataset
        return {
          status: status.replace(/\b\w/g, l => l.toUpperCase()),
          avgDays: data.count > 0 ? data.totalDays / data.count : 0,
        };
      })
      .filter((item): item is { status: string; avgDays: number } => item !== null);


    return {
      labels: avgTimes.map(item => item.status),
      avgDays: avgTimes.map(item => item.avgDays),
    };
  }, []);


  const configFactory = useCallback((): ChartConfiguration => {
    const { labels, avgDays } = processData(data);
    
    const getBarColor = (days: number) => {
        if (days > 30) return '#ef4444'; // Red
        if (days > 15) return '#facc15'; // Yellow
        return '#22c55e'; // Green
    }

    const chartData: ChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Dias Médios',
          data: avgDays,
          backgroundColor: avgDays.map(getBarColor),
          borderColor: '#334155',
          borderWidth: 1,
          borderRadius: 4,
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
            callbacks: {
              label: (context) => `${(context.raw as number).toFixed(1)} dias`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: '#334155' },
            ticks: { color: '#94a3b8' },
            title: {
                display: true,
                text: 'Dias',
                color: '#94a3b8'
            }
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

export default AvgTimeInStageChart;
