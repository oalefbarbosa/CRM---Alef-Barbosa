
import React, { useCallback } from 'react';
import { useChart } from './BaseChart';
import { CampaignData } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import type { ChartConfiguration, ChartData } from 'chart.js';

interface CplByCampaignChartProps {
  data: CampaignData[];
}

const CplByCampaignChart: React.FC<CplByCampaignChartProps> = ({ data }) => {
  const processData = useCallback((campaignData: CampaignData[]) => {
    const campaignStats = campaignData.reduce((acc, campaign) => {
      const name = campaign.nome || 'Campanha sem nome';
      if (!acc[name]) {
        acc[name] = { totalLeads: 0, totalSpent: 0 };
      }
      acc[name].totalLeads += (campaign.leads + campaign.leadFormulario);
      acc[name].totalSpent += campaign.valorUsado;
      return acc;
    }, {} as { [key: string]: { totalLeads: number; totalSpent: number } });

    const campaignsWithCpl = Object.entries(campaignStats)
      .map(([name, stats]) => ({
        name,
        cpl: stats.totalLeads > 0 ? stats.totalSpent / stats.totalLeads : 0,
      }))
      .filter(c => c.cpl > 0); // Only show campaigns that have a cost and generated leads

    campaignsWithCpl.sort((a, b) => b.cpl - a.cpl); // Sort descending by CPL

    return {
      labels: campaignsWithCpl.map(c => c.name.substring(0, 30) + (c.name.length > 30 ? '...' : '')),
      cpls: campaignsWithCpl.map(c => c.cpl),
    };
  }, []);

  const configFactory = useCallback((): ChartConfiguration => {
    const { labels, cpls } = processData(data);

    const getBarColor = (cpl: number) => {
        if (cpl <= 5) return '#22c55e'; // Green - Great
        if (cpl <= 10) return '#facc15'; // Yellow - Good
        return '#ef4444'; // Red - Attention
    };

    const chartData: ChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Custo por Lead',
          data: cpls,
          backgroundColor: cpls.map(getBarColor),
          borderColor: '#334155',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
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
              label: (context) => `CPL: ${formatCurrency(context.raw as number)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: '#334155' },
            ticks: { 
              color: '#94a3b8',
              callback: (value) => formatCurrency(value as number),
            },
            title: {
                display: true,
                text: 'Custo por Lead (R$)',
                color: '#94a3b8'
            }
          },
          y: {
            grid: { display: false },
            ticks: { color: '#f8fafc', font: { size: 10 } },
          },
        },
      },
    };
  }, [data, processData]);

  const canvasRef = useChart(configFactory, data);

  return <canvas ref={canvasRef} />;
};

export default CplByCampaignChart;
