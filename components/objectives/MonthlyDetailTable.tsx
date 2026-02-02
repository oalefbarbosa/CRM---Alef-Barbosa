
import React from 'react';
import { MonthlyScenarioData } from '../../types';
import ChartCard from '../ChartCard';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface MonthlyDetailTableProps {
    realizedData: { mes: number, faturamento_real: number }[];
    metaData: MonthlyScenarioData[];
    selectedYear: number;
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const ProgressBadge: React.FC<{ percentage: number }> = ({ percentage }) => {
    let colorClass = 'bg-red-500/10 text-brand-red';
    let text = 'Crítico';
    if (percentage >= 100) {
        colorClass = 'bg-green-500/10 text-brand-green';
        text = '✓ Atingido';
    } else if (percentage >= 80) {
        colorClass = 'bg-yellow-500/10 text-brand-yellow';
        text = 'No caminho';
    } else if (percentage >= 50) {
        colorClass = 'bg-orange-500/10 text-brand-orange';
        text = 'Atenção';
    }
    return <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colorClass}`}>{text}</span>;
};

const MonthlyDetailTable: React.FC<MonthlyDetailTableProps> = ({ realizedData, metaData, selectedYear }) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    return (
        <ChartCard title="Detalhamento Mensal" loading={false}>
            <div className="overflow-y-auto h-full custom-scrollbar">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card">
                        <tr className="text-left text-xs text-text-secondary uppercase">
                            <th className="p-2">Mês</th>
                            <th className="p-2 text-right">Fat. Meta</th>
                            <th className="p-2 text-right">Fat. Real</th>
                            <th className="p-2 text-center">Status</th>
                            <th className="p-2 text-right">Gap</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {metaData.map((row, index) => {
                            const realized = realizedData[index];
                            const isCurrentMonth = row.mes === currentMonth && selectedYear === currentYear;
                            const isFutureMonth = selectedYear > currentYear || (selectedYear === currentYear && row.mes > currentMonth);
                            const progress = (realized.faturamento_real / (row.faturamento_projetado || 1)) * 100;
                            const gap = realized.faturamento_real - row.faturamento_projetado;

                            return (
                                <tr key={row.mes} className={`${isCurrentMonth ? 'bg-blue-500/5' : ''} ${isFutureMonth ? 'opacity-60' : ''}`}>
                                    <td className="p-2 font-bold text-text-main">{monthNames[row.mes - 1]}</td>
                                    <td className="p-2 text-right font-mono text-text-secondary">{formatCurrency(row.faturamento_projetado)}</td>
                                    <td className="p-2 text-right font-mono font-semibold text-text-main">{isFutureMonth ? '-' : formatCurrency(realized.faturamento_real)}</td>
                                    <td className="p-2 text-center">{isFutureMonth ? '○' : <ProgressBadge percentage={progress} />}</td>
                                    <td className={`p-2 text-right font-mono ${gap >= 0 ? 'text-green-500' : 'text-red-500'}`}>{isFutureMonth ? '-' : formatCurrency(gap)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </ChartCard>
    );
};

export default MonthlyDetailTable;
