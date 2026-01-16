
import React from 'react';
import { TimeFunnelAnalysis } from '../types';
import ChartCard from './ChartCard';
import { Bar } from 'react-chartjs-2';
import * as Icons from './Icons';

const STAGE_NAME_MAP: { [key: string]: string } = {
    'em prospecção': 'Prospecção', 'reunião de triagem': 'Triagem',
    'reunião de proposta': 'Proposta', 'em follow up': 'Follow Up', 'em negociação': 'Negociação'
};
const getStageName = (key: string) => STAGE_NAME_MAP[key] || key;

const TimeFunnelSection: React.FC<{ data: TimeFunnelAnalysis }> = ({ data }) => {
    const chartData = {
        labels: data.stages.map(s => getStageName(s.name)),
        datasets: [{
            label: 'Dias',
            data: data.stages.map(s => s.days),
            backgroundColor: '#f97316'
        }]
    };
    const chartOptions = {
        indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx: any) => `${ctx.raw.toFixed(1)} dias` } }
        },
        scales: {
            x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
            y: { grid: { display: false }, ticks: { color: '#f8fafc' } }
        }
    };

    return (
        <ChartCard title="🕐 Tempo Médio em Cada Etapa" loading={false} className="lg:col-span-2">
            <div className="h-72">
                 <Bar data={chartData} options={chartOptions}/>
            </div>
            {data.bottleneck && (
                <div className="mt-4 pt-4 border-t border-border flex items-start gap-2 text-brand-orange">
                    <Icons.AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold">Gargalo de tempo: {getStageName(data.bottleneck)} é a etapa mais demorada.</p>
                </div>
            )}
        </ChartCard>
    );
};

export default TimeFunnelSection;