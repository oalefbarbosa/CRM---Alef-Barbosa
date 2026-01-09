
import React, { useCallback } from 'react';
import { useChart } from './BaseChart';
import { CrmData } from '../../types';
import type { ChartConfiguration, ChartData } from 'chart.js';

interface LossReasonChartProps {
  data: CrmData[];
}

const LossReasonChart: React.FC<LossReasonChartProps> = ({ data }) => {
  const processData = useCallback((crmData: CrmData[]) => {
    const lostLeads = crmData.filter(lead => lead.status === 'perdido' && lead.motivoPerda && lead.motivoPerda !== 'N/A');
    const reasonCounts = lostLeads.reduce((acc, lead) => {
      acc[lead.motivoPerda] = (acc[lead.motivoPerda] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);

    return {
      labels: sortedReasons.map(entry => entry[0]),
      counts: sortedReasons.map(entry => entry[1]),
    };
  }, []);

  const configFactory = useCallback((): ChartConfiguration => {
    const { labels, counts } = processData(data);

    const chartData: ChartData = {
      labels: labels,
      datasets: [{
        label: 'Leads Perdidos',
        data: counts,
        backgroundColor: ['#ef4444', '#f97316', '#facc15'],
        borderColor: '#334155',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6,
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

export default LossReasonChart;
