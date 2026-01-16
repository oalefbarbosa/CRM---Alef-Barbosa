
import React from 'react';
import { ForecastAnalysis } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import * as Icons from './Icons';

const ForecastSection: React.FC<{ data: ForecastAnalysis }> = ({ data }) => {
    const highProb = data.leads.filter(l => l.probability > 75);
    const midProb = data.leads.filter(l => l.probability <= 75 && l.probability > 50);

    const ProbPill: React.FC<{ prob: number }> = ({ prob }) => {
        const color = prob > 75 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400';
        return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{prob.toFixed(0)}%</span>
    };

    return (
        <section className="space-y-8">
            <h2 className="text-xl font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">🔮 Previsão de Fechamentos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-card border-border border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <h3 className="text-sm font-bold text-text-secondary uppercase mb-2">Próximos 7 dias</h3>
                    <p className="text-4xl font-extrabold text-brand-cyan">{data.next7Days.sales.min}-{data.next7Days.sales.max} vendas</p>
                    <p className="text-2xl font-bold text-slate-400">{formatCurrency(data.next7Days.value.min)} - {formatCurrency(data.next7Days.value.max)}</p>
                    <p className="text-xs text-text-secondary mt-3">Baseado no pipeline atual e ciclo médio de vendas.</p>
                </div>
                <div className="lg:col-span-2 bg-card border-border border rounded-xl p-6">
                    <h3 className="text-base font-bold text-text-main mb-3">Leads com maior probabilidade de fechar</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-semibold mb-2 text-green-400">🔥 Alta Probabilidade ({'>'}75%)</p>
                            <ul className="text-sm space-y-2">{highProb.length > 0 ? highProb.map(l => (
                                <li key={l.name} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-md">
                                    <div><p className="font-semibold">{l.name}</p><p className="text-xs text-text-secondary">{l.status} • {formatCurrency(l.value)}</p></div>
                                    <ProbPill prob={l.probability} />
                                </li>
                            )) : <p className="text-xs text-text-secondary">Nenhum lead nesta categoria.</p>}</ul>
                        </div>
                        <div>
                            <p className="text-sm font-semibold mb-2 text-yellow-400">🟡 Média Probabilidade (50-75%)</p>
                            <ul className="text-sm space-y-2">{midProb.length > 0 ? midProb.map(l => (
                                 <li key={l.name} className="flex justify-between items-center bg-slate-800/50 p-2 rounded-md">
                                    <div><p className="font-semibold">{l.name}</p><p className="text-xs text-text-secondary">{l.status} • {formatCurrency(l.value)}</p></div>
                                    <ProbPill prob={l.probability} />
                                </li>
                            )) : <p className="text-xs text-text-secondary">Nenhum lead nesta categoria.</p>}</ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ForecastSection;