
import React, { useCallback } from 'react';
import { useChart } from './BaseChart';
import { CrmData } from '../../types';
import type { ChartConfiguration, ChartData } from 'chart.js';

interface LeadsByBusinessChartProps {
  data: CrmData[];
}

const LeadsByBusinessChart: React.FC<LeadsByBusinessChartProps> = ({ data }) => {
  const processData = useCallback((crmData: CrmData[]) => {
    const businessCounts = crmData.reduce((acc, lead) => {
      const type = lead.tipoNegocio || 'Não especificado';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const sorted = Object.entries(businessCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

    return {
      labels: sorted.map(entry => entry[0]),
      counts: sorted.map(entry => entry[1]),
    };
  }, []);

  const configFactory = useCallback((): ChartConfiguration => {
    const { labels, counts } = processData(data);
    const chartData: ChartData = {
      labels,
      datasets: [{
        label: 'Leads',
        data: counts,
        backgroundColor: '#22d3d8',
        borderColor: '#67e8f9',
        borderWidth: 1,
        borderRadius: 4,
      }],
    };

    return {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#f8fafc' },
          },
          y: {
            grid: { color: '#334155' },
            ticks: { color: '#94a3b8' },
          },
        },
      },
    };
  }, [data, processData]);

  const canvasRef = useChart(configFactory, data);

  return <canvas ref={canvasRef} />;
};

export default LeadsByBusinessChart;
