
import React from 'react';
import { ResponsibleAnalysis, ResponsibleData } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import ChartCard from './ChartCard';
import { Bar } from 'react-chartjs-2';

const RankingCard: React.FC<{ rank: number, data: ResponsibleData }> = ({ rank, data }) => {
    const medals = ['🥇', '🥈', '🥉'];
    return (
        <div className="bg-slate-800/50 p-4 rounded-lg">
            <div className="flex items-baseline gap-2">
                <span className="text-2xl">{medals[rank - 1]}</span>
                <p className="font-bold text-lg text-text-main">{data.name}</p>
            </div>
            <div className="text-sm text-text-secondary grid grid-cols-3 gap-2 mt-2">
                <div><span className="font-bold text-text-main">{data.sales}</span> vendas</div>
                <div><span className="font-bold text-text-main">{formatCurrency(data.totalValue)}</span></div>
                <div><span className="font-bold text-text-main">{formatPercent(data.conversionRate)}</span> conv.</div>
            </div>
        </div>
    );
};

const ResponsibleAnalysisSection: React.FC<{ data: ResponsibleAnalysis }> = ({ data }) => {
    const chartData = {
        labels: data.performanceChart.labels,
        datasets: [
            { label: 'Vendas (Qtd)', data: data.performanceChart.sales, backgroundColor: '#3b82f6', yAxisID: 'y' },
            { label: 'Valor (R$)', data: data.performanceChart.values, backgroundColor: '#8b5cf6', yAxisID: 'y1' },
        ]
    };
    const chartOptions = {
        indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
        scales: { 
            x: { display: false }, y: { grid: { color: '#33415520' }, ticks: { color: '#f8fafc' }},
            y1: { display: false }
        }
    };

    const headers: {key: keyof ResponsibleData, label: string}[] = [
        {key: 'name', label: 'Nome'}, {key: 'totalLeads', label: 'Leads'}, {key: 'sales', label: 'Vendas'},
        {key: 'conversionRate', label: 'Taxa %'}, {key: 'totalValue', label: 'Valor Total'}, {key: 'avgTicket', label: 'Ticket Médio'},
        {key: 'avgTimeToClose', label: 'Tempo Médio'}, {key: 'score', label: 'Score'}
    ];

    return (
        <section className="space-y-8">
            <h2 className="text-xl font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">👥 Análise por Responsável</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Ranking de Performance" loading={false}>
                    <div className="space-y-3">{data.ranking.map((rep, i) => <RankingCard key={rep.name} rank={i+1} data={rep}/>)}</div>
                </ChartCard>
                <ChartCard title="Performance Individual" loading={false} contentClassName="h-72">
                    <Bar data={chartData} options={chartOptions} />
                </ChartCard>
            </div>
            <div className="bg-card border-border border rounded-xl p-4 overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-text-secondary uppercase"><tr>{headers.map(h => <th key={h.key} className="p-2">{h.label}</th>)}</tr></thead>
                    <tbody>{data.detailed.map(rep => (
                        <tr key={rep.name} className="border-t border-border hover:bg-slate-800/50">
                            <td className="p-2 font-semibold">{rep.name}</td>
                            <td className="p-2">{formatNumber(rep.totalLeads)}</td>
                            <td className="p-2">{formatNumber(rep.sales)}</td>
                            <td className="p-2">{formatPercent(rep.conversionRate)}</td>
                            <td className="p-2">{formatCurrency(rep.totalValue)}</td>
                            <td className="p-2">{formatCurrency(rep.avgTicket)}</td>
                            <td className="p-2">{rep.avgTimeToClose.toFixed(1)} dias</td>
                            <td className="p-2 text-lg">{'⭐'.repeat(rep.score).padEnd(5, '☆')}</td>
                        </tr>
                    ))}</tbody>
                 </table>
            </div>
        </section>
    );
};

export default ResponsibleAnalysisSection;