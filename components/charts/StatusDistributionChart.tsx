
import React, { useCallback } from 'react';
import { useChart } from './BaseChart';
import { CrmData } from '../../types';
import type { ChartConfiguration, ChartData } from 'chart.js';

interface StatusDistributionChartProps {
  data: CrmData[];
}

const statusColors: { [key: string]: string } = {
  'ganho': '#22c55e',
  'perdido': '#ef4444',
  'em prospecção': '#3b82f6',
  'reunião de proposta': '#a855f7',
  'em follow up': '#f97316',
  'leads': '#94a3b8',
};

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data }) => {
  const processData = useCallback((crmData: CrmData[]) => {
    const statusCounts = crmData.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return {
      labels: Object.keys(statusCounts).map(s => s.replace(/\b\w/g, l => l.toUpperCase())),
      counts: Object.values(statusCounts),
      colors: Object.keys(statusCounts).map(s => statusColors[s] || '#64748b'),
      total: crmData.length,
    };
  }, []);

  const configFactory = useCallback((): ChartConfiguration => {
    const { labels, counts, colors, total } = processData(data);
    const chartData: ChartData = {
      labels: labels,
      datasets: [{
        label: 'Status',
        data: counts,
        backgroundColor: colors,
        borderColor: '#1e293b',
        borderWidth: 2,
        hoverOffset: 4,
      }],
    };

    return {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#f8fafc',
              boxWidth: 12,
              padding: 15,
            },
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
          },
          // Custom plugin to display total in the center
          ... {
            centerText: {
              display: true,
              text: total.toString(),
              font: 'bold 24px Inter, sans-serif',
              color: '#f8fafc'
            }
          }
        },
      },
      plugins: [{
        id: 'centerText',
        beforeDraw: function(chart: any) {
          if (chart.options.plugins.centerText.display) {
            const ctx = chart.ctx;
            const centerConfig = chart.options.plugins.centerText;
            const fontStyle = centerConfig.font;
            const txt = centerConfig.text;
            const color = centerConfig.color;
            ctx.save();
            ctx.font = fontStyle;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.fillStyle = color;
            const x = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
            const y = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
            ctx.fillText(txt, x, y);
            ctx.restore();
          }
        }
      }]
    };
  }, [data, processData]);
  
  const canvasRef = useChart(configFactory, data);

  return <canvas ref={canvasRef} />;
};

export default StatusDistributionChart;
