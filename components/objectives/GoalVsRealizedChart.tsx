
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { MonthlyScenarioData, FunnelConfig } from '../../types';
import ChartCard from '../ChartCard';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface GoalVsRealizedChartProps {
    realizedData: { mes: number, faturamento_real: number, leads_real: number }[];
    metaData: MonthlyScenarioData[];
    metric: 'faturamento' | 'clientes' | 'leads';
    setMetric: (metric: 'faturamento' | 'clientes' | 'leads') => void;
    config: FunnelConfig;
}

const GoalVsRealizedChart: React.FC<GoalVsRealizedChartProps> = ({ realizedData, metaData, metric, setMetric, config }) => {
    const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const getChartData = () => {
        let meta: number[] = [];
        let realized: number[] = [];
        const leadsMes = config.cpl > 0 ? config.investimento_mensal / config.cpl : 0;

        switch (metric) {
            case 'faturamento':
                meta = metaData.map(m => m.faturamento_projetado);
                realized = realizedData.map(r => r.faturamento_real);
                break;
            case 'clientes':
                meta = metaData.map(m => m.clientes_projetados);
                // Realized clients is an accumulating snapshot, so we'll show the meta line only for now
                 realized = Array(12).fill(0); // Placeholder as this is a cumulative metric
                break;
            case 'leads':
                meta = Array(12).fill(leadsMes);
                realized = realizedData.map(r => r.leads_real);
                break;
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Meta',
                    data: meta,
                    backgroundColor: 'rgba(100, 116, 139, 0.3)',
                    borderColor: 'rgba(100, 116, 139, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
                {
                    label: 'Realizado',
                    data: realized,
                    backgroundColor: '#8b5cf6',
                    borderColor: '#a78bfa',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ]
        };
    };

    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        const value = context.parsed.y;
                        if (value !== null) {
                            label += metric === 'faturamento' ? formatCurrency(value) : formatNumber(value);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
            y: {
                grid: { color: '#334155' },
                ticks: {
                    color: '#94a3b8',
                    callback: (v: any) => metric === 'faturamento' ? formatCurrency(v) : formatNumber(v),
                }
            }
        }
    };

    return (
        <ChartCard title="Meta vs. Realizado" loading={false} contentClassName="h-80">
            <div className="flex justify-center gap-2 mb-4">
                {(['faturamento', 'clientes', 'leads'] as const).map(m => (
                    <button key={m} onClick={() => setMetric(m)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors capitalize ${metric === m ? 'bg-brand-blue text-white' : 'bg-bg-subtle text-text-secondary hover:bg-slate-700'}`}>
                        {m}
                    </button>
                ))}
            </div>
            <div className="h-[calc(100%-40px)]">
                <Bar options={chartOptions} data={getChartData()} />
            </div>
        </ChartCard>
    );
};

export default GoalVsRealizedChart;
