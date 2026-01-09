
import React, { useCallback } from 'react';
import { useChart } from './BaseChart';
import { CampaignData } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import type { ChartConfiguration, ChartData } from 'chart.js';

interface CampaignPerformanceChartProps {
  data: CampaignData[];
}

const CampaignPerformanceChart: React.FC<CampaignPerformanceChartProps> = ({ data }) => {
  const processData = useCallback((campaignData: CampaignData[]) => {
    const campaignStats = campaignData.reduce((acc, campaign) => {
      const name = campaign.nome || 'Campanha sem nome';
      if (!acc[name]) {
        acc[name] = { leads: 0, spent: 0 };
      }
      acc[name].leads += (campaign.leads + campaign.leadFormulario);
      acc[name].spent += campaign.valorUsado;
      return acc;
    }, {} as { [key: string]: { leads: number; spent: number } });

    const sortedCampaigns = Object.entries(campaignStats)
        .sort((a, b) => b[1].leads - a[1].leads)
        .slice(0, 15); // Top 15 campaigns

    return {
      labels: sortedCampaigns.map(entry => entry[0].substring(0, 25) + (entry[0].length > 25 ? '...' : '')),
      leads: sortedCampaigns.map(entry => entry[1].leads),
      spent: sortedCampaigns.map(entry => entry[1].spent),
    };
  }, []);

  const configFactory = useCallback((): ChartConfiguration => {
    const { labels, leads, spent } = processData(data);

    const chartData: ChartData = {
      labels: labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Leads Gerados',
          data: leads,
          backgroundColor: '#22d3d8',
          yAxisID: 'y',
          order: 2,
        },
        {
          type: 'line' as const,
          label: 'Investimento (R$)',
          data: spent,
          borderColor: '#a855f7',
          backgroundColor: '#a855f7',
          yAxisID: 'y1',
          tension: 0.2,
          order: 1,
        },
      ],
    };

    return {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#f8fafc' },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8' },
          },
          y: {
            type: 'linear',
            position: 'left',
            grid: { color: '#334155' },
            ticks: { color: '#94a3b8' },
            title: { display: true, text: 'Leads Gerados', color: '#94a3b8' },
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { 
              color: '#94a3b8',
              callback: (value) => formatCurrency(value as number),
            },
            title: { display: true, text: 'Investimento (R$)', color: '#94a3b8' },
          },
        },
      },
    };
  }, [data, processData]);

  const canvasRef = useChart(configFactory, data);

  return <canvas ref={canvasRef} />;
};

export default CampaignPerformanceChart;
