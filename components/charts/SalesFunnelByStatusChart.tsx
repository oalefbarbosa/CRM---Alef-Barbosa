
import React, { useCallback } from 'react';
import { useChart } from './BaseChart';
import { CrmData } from '../../types';
import type { ChartConfiguration, ChartData } from 'chart.js';

interface SalesFunnelByStatusChartProps {
  data: CrmData[];
}

const statusOrder = ['leads', 'em prospecção', 'reunião de triagem', 'reunião de proposta', 'em follow up', 'em negociação', 'ganho', 'perdido'];

const statusColors: { [key: string]: string } = {
    'leads': '#3b82f6', // blue
    'em prospecção': '#22d3d8', // cyan
    'reunião de proposta': '#a855f7', // purple
    'em follow up': '#f97316', // orange
    'ganho': '#22c55e', // green
    'perdido': '#ef4444', // red
    'reunião de triagem': '#6366f1', // indigo
};

const SalesFunnelByStatusChart: React.FC<SalesFunnelByStatusChartProps> = ({ data }) => {
    const processData = useCallback((crmData: CrmData[]) => {
        const statusCounts = crmData.reduce((acc, lead) => {
            const status = lead.status || 'leads';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const sortedLabels = Object.keys(statusCounts).sort((a, b) => {
            const indexA = statusOrder.indexOf(a);
            const indexB = statusOrder.indexOf(b);
            // Pushes statuses not in the order array to the end
            return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
        });

        return {
            labels: sortedLabels.map(s => s.replace(/\b\w/g, l => l.toUpperCase())),
            counts: sortedLabels.map(s => statusCounts[s]),
            colors: sortedLabels.map(s => statusColors[s] || '#64748b'),
        };
    }, []);

    const configFactory = useCallback((): ChartConfiguration => {
        const { labels, counts, colors } = processData(data);
        const chartData: ChartData = {
            labels: labels,
            datasets: [{
                label: 'Leads',
                data: counts,
                backgroundColor: colors,
                borderColor: '#334155',
                borderWidth: 1,
                borderRadius: 4,
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
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#94a3b8',
                    },
                },
                scales: {
                    x: {
                        grid: { color: '#334155' },
                        ticks: { color: '#94a3b8' },
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

export default SalesFunnelByStatusChart;