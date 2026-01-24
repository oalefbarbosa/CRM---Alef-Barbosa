
import React, { useCallback, useEffect, useState } from 'react';
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
    // Detect theme change to update chart colors
    const [textColor, setTextColor] = useState('#94a3b8');
    const [gridColor, setGridColor] = useState('#334155');

    useEffect(() => {
        const updateColors = () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            setTextColor(isLight ? '#64748b' : '#94a3b8');
            setGridColor(isLight ? '#e2e8f0' : '#334155');
        };
        
        // Initial set
        updateColors();

        // Observer for theme attribute changes
        const observer = new MutationObserver(updateColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => observer.disconnect();
    }, []);

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
                borderColor: gridColor,
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
                        backgroundColor: gridColor === '#e2e8f0' ? '#ffffff' : '#1e293b',
                        titleColor: gridColor === '#e2e8f0' ? '#0f172a' : '#f8fafc',
                        bodyColor: textColor,
                        borderColor: gridColor,
                        borderWidth: 1,
                    },
                },
                scales: {
                    x: {
                        grid: { color: gridColor },
                        ticks: { color: textColor },
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { size: 10 } },
                    },
                },
            },
        };
    }, [data, processData, textColor, gridColor]);

    const canvasRef = useChart(configFactory, data);

    return <canvas ref={canvasRef} />;
};

export default SalesFunnelByStatusChart;
