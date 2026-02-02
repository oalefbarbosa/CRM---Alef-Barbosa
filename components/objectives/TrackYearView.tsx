
import React, { useState, useMemo } from 'react';
import { FunnelConfig, Projections, ScenarioType } from '../../types';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';
import ProgressBar from '../ProgressBar';
import ChartCard from '../ChartCard';
import { Bar } from 'react-chartjs-2';

// --- SUB-COMPONENTS ---

const YearlyProgressCard: React.FC<{title: string, realized: number, goal: number, format: 'currency'|'number'}> = ({ title, realized, goal, format }) => {
    const percentage = goal > 0 ? (realized / goal) * 100 : 0;
    return(
        <div className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-sm font-bold text-text-secondary uppercase">{title}</p>
            <p className="text-4xl font-extrabold text-text-main mt-4">{format === 'currency' ? formatCurrency(realized) : formatNumber(realized)}</p>
            <p className="text-xs text-text-secondary">realizado</p>
            <hr className="border-border/50 my-4" />
            <p className="text-sm text-text-secondary">Meta: <span className="font-bold text-text-main">{format === 'currency' ? formatCurrency(goal) : formatNumber(goal)}</span></p>
            <p className="text-sm text-text-secondary">Falta: <span className="font-bold text-brand-red">{format === 'currency' ? formatCurrency(goal - realized) : formatNumber(goal - realized)}</span></p>
            <div className="mt-4"><ProgressBar value={realized} max={goal} colorClass="bg-brand-blue" /></div>
        </div>
    );
};

const YearlyDetailTable: React.FC<{realized: any, meta: any, selectedYear: number}> = ({ realized, meta, selectedYear }) => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    let deficitAcumulado = 0;

    return (
        <div className="overflow-x-auto custom-scrollbar"><table className="w-full text-sm">
            <thead className="text-left text-xs text-text-secondary uppercase"><tr>
                <th className="p-2">Mês</th>
                <th className="p-2 text-right">Fat. Meta</th>
                <th className="p-2 text-right">Fat. Real</th>
                <th className="p-2 text-right">Diferença</th>
                <th className="p-2 text-right">Acumulado</th>
                <th className="p-2 text-right">Clientes Meta</th>
                <th className="p-2 text-center">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-border">{meta.map((row: any, i: number) => {
                const real = realized.monthly[i];
                const isFuture = selectedYear > currentYear || (selectedYear === currentYear && row.mes > currentMonth);
                const metaOriginal = row.faturamento_projetado;
                const metaAjustada = metaOriginal + deficitAcumulado;
                const diferenca = isFuture ? 0 : real.faturamento_real - metaAjustada;
                if (!isFuture && diferenca < 0) { deficitAcumulado = Math.abs(diferenca); } else if (!isFuture) { deficitAcumulado = 0; }
                const progress = metaAjustada > 0 ? (real.faturamento_real / metaAjustada) * 100 : 0;
                return (
                    <tr key={row.mes} className={`${isFuture ? 'opacity-60' : ''}`}>
                        <td className="p-2 font-bold text-text-main">{monthNames[i]}</td>
                        <td className="p-2 text-right font-mono text-text-secondary">{formatCurrency(metaOriginal)} {deficitAcumulado > 0 && !isFuture && <span className="text-brand-orange">(+{formatCurrency(deficitAcumulado)})</span>}</td>
                        <td className="p-2 text-right font-mono text-text-main font-bold">{isFuture ? '-' : formatCurrency(real.faturamento_real)}</td>
                        <td className={`p-2 text-right font-mono ${diferenca >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>{isFuture ? '-' : formatCurrency(diferenca)}</td>
                        <td className="p-2 text-right font-mono text-brand-orange">{isFuture && deficitAcumulado > 0 ? `(${formatCurrency(deficitAcumulado)})` : '-'}</td>
                        <td className="p-2 text-right font-mono text-text-secondary">{formatNumber(row.clientes_projetados)}</td>
                        <td className="p-2 text-center">{isFuture ? '○' : progress >= 80 ? '🟢' : progress >= 50 ? '🟡' : '🔴'}</td>
                    </tr>
                );
            })}</tbody>
        </table></div>
    );
};

// --- MAIN VIEW COMPONENT ---

interface TrackYearViewProps {
  funnelConfig: FunnelConfig;
  projections: Projections;
  realized: { monthly: any[]; total: { clientes_real: number; }; };
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
}

const TrackYearView: React.FC<TrackYearViewProps> = ({ funnelConfig, projections, realized, selectedYear, availableYears, onYearChange }) => {
    const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('inicial');
    const scenarioData = projections[selectedScenario];
    const aggregatedData = useMemo(() => {
        const leadsMes = funnelConfig.cpl > 0 ? funnelConfig.investimento_mensal / funnelConfig.cpl : 0;
        return {
            faturamento_real: realized.monthly.reduce((s, m) => s + m.faturamento_real, 0),
            faturamento_meta: scenarioData.reduce((s, m) => s + m.faturamento_projetado, 0),
            clientes_real: realized.total.clientes_real,
            clientes_meta: scenarioData[11]?.clientes_projetados || 0,
            leads_real: realized.monthly.reduce((s, m) => s + m.leads_real, 0),
            leads_meta: leadsMes * 12,
        };
    }, [realized, scenarioData, funnelConfig]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-card border border-border p-3 rounded-xl shadow-sm gap-4">
                <div> <label className="text-sm font-semibold text-text-secondary mr-2">Cenário:</label> <div className="inline-grid grid-cols-3 bg-bg-subtle p-1 rounded-lg"> {(['inicial', 'bom', 'otimo'] as ScenarioType[]).map(s => ( <button key={s} onClick={() => setSelectedScenario(s)} className={`py-1 px-4 rounded-md font-bold transition-all text-sm capitalize ${selectedScenario === s ? 'bg-brand-blue text-white shadow' : 'text-text-secondary hover:text-text-main'}`}>{s}</button> ))} </div> </div>
                <div> <label className="text-sm font-semibold text-text-secondary mr-2">Ano:</label> <select value={selectedYear} onChange={(e) => onYearChange(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-1 text-text-main focus:outline-none focus:ring-1 focus:ring-brand-blue text-sm"> {availableYears.map(year => <option key={year} value={year}>{year}</option>)} </select> </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <YearlyProgressCard title="Faturamento Ano" realized={aggregatedData.faturamento_real} goal={aggregatedData.faturamento_meta} format="currency" />
                <YearlyProgressCard title="Clientes" realized={aggregatedData.clientes_real} goal={aggregatedData.clientes_meta} format="number" />
                <YearlyProgressCard title="Leads" realized={aggregatedData.leads_real} goal={aggregatedData.leads_meta} format="number" />
            </div>

            <ChartCard title="Detalhamento Mês a Mês" loading={false}><YearlyDetailTable realized={realized} meta={scenarioData} selectedYear={selectedYear}/></ChartCard>
        </div>
    );
};

export default TrackYearView;
