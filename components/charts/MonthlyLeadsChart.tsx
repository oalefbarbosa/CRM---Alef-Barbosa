
import React, { useCallback } from 'react';
import { useChart } from './BaseChart';
import { CrmData } from '../../types';
import type { ChartConfiguration, ChartData } from 'chart.js';

interface MonthlyLeadsChartProps {
  data: CrmData[];
}

const MonthlyLeadsChart: React.FC<MonthlyLeadsChartProps> = ({ data }) => {
  const processData = useCallback((crmData: CrmData[]) => {
    const monthlyCounts = crmData.reduce((acc, lead) => {
      const monthYear = lead.dataCriacao.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      const dateKey = `${lead.dataCriacao.getFullYear()}-${String(lead.dataCriacao.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[dateKey]) {
        acc[dateKey] = { label: monthYear, count: 0 };
      }
      acc[dateKey].count++;
      return acc;
    }, {} as { [key: string]: { label: string, count: number } });

    const sortedMonths = Object.entries(monthlyCounts).sort((a, b) => a[0].localeCompare(b[0]));
    
    return {
      labels: sortedMonths.map(entry => entry[1].label),
      counts: sortedMonths.map(entry => entry[1].count),
    };
  }, []);

  const configFactory = useCallback((): ChartConfiguration => {
    const { labels, counts } = processData(data);

    const chartData: ChartData = {
      labels: labels,
      datasets: [{
        label: 'Novos Leads',
        data: counts,
        borderColor: '#22d3d8',
        backgroundColor: 'rgba(34, 211, 216, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#22d3d8',
        pointBorderColor: '#f8fafc',
        pointHoverRadius: 7,
        pointRadius: 5,
      }],
    };

    return {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#334155' },
            ticks: { color: '#94a3b8' },
          },
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' },
          },
        },
      },
    };
  }, [data, processData]);

  const canvasRef = useChart(configFactory, data);

  return <canvas ref={canvasRef} />;
};

export default MonthlyLeadsChart;
