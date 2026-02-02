
import React, { useState, useMemo } from 'react';
import { FunnelConfig, Projections, ScenarioType } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import ChartCard from '../ChartCard';
import GoalProgressCard from './GoalProgressCard';

// --- SUB-COMPONENTS ---

const YearlyDetailTable: React.FC<{realized: any, meta: any, selectedYear: number}> = ({ realized, meta, selectedYear }) => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const currentMonth = new Date().getUTCMonth() + 1;
    const currentYear = new Date().getUTCFullYear();
    let ajusteAcumulado = 0; // Can be positive (deficit from past month) or negative (surplus)

    return (
        <div className="overflow-x-auto custom-scrollbar"><table className="w-full text-sm">
            <thead className="text-left text-xs text-text-secondary uppercase"><tr>
                <th className="p-2 whitespace-nowrap">Mês</th>
                <th className="p-2 text-right whitespace-nowrap">Fat. Projetado</th>
                <th className="p-2 text-right whitespace-nowrap">Fat. Real</th>
                <th className="p-2 text-right whitespace-nowrap">Diferença</th>
                <th className="p-2 text-right whitespace-nowrap">Ajuste p/ Mês Seg.</th>
                <th className="p-2 text-right whitespace-nowrap">Clientes Meta</th>
                <th className="p-2 text-center whitespace-nowrap">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-border">{meta.map((row: any, i: number) => {
                const real = realized.monthly[i];
                const isFuture = selectedYear > currentYear || (selectedYear === currentYear && row.mes > currentMonth);
                
                const metaOriginal = row.faturamento_projetado;
                const metaAjustada = metaOriginal + ajusteAcumulado;
                const diferenca = isFuture ? 0 : real.faturamento_real - metaAjustada;
                
                // This is the adjustment that will be carried over to the *next* month.
                // For future months, the adjustment from the last completed month is just carried forward.
                const proximoAjuste = isFuture ? ajusteAcumulado : -diferenca;
                
                const progress = metaAjustada > 0 ? (real.faturamento_real / metaAjustada) * 100 : 0;
                
                const rowContent = (
                    <tr key={row.mes} className={`${isFuture ? 'opacity-60' : ''}`}>
                        <td className="p-2 font-bold text-text-main whitespace-nowrap">{monthNames[i]}</td>
                        <td className="p-2 text-right font-mono text-text-secondary whitespace-nowrap">
                            {formatCurrency(metaOriginal)}
                            {ajusteAcumulado !== 0 && (
                                <span className={`ml-1 text-xs ${ajusteAcumulado > 0 ? 'text-brand-orange' : 'text-brand-green'}`}>
                                    ({ajusteAcumulado > 0 ? '+' : ''}{formatCurrency(ajusteAcumulado)})
                                </span>
                            )}
                        </td>
                        <td className="p-2 text-right font-mono text-text-main font-bold whitespace-nowrap">{isFuture ? '-' : formatCurrency(real.faturamento_real)}</td>
                        <td className={`p-2 text-right font-mono whitespace-nowrap ${diferenca >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>{isFuture ? '-' : formatCurrency(diferenca)}</td>
                        <td className={`p-2 text-right font-mono whitespace-nowrap ${proximoAjuste > 0 ? 'text-brand-orange' : proximoAjuste < 0 ? 'text-brand-green' : 'text-text-secondary'}`}>{proximoAjuste !== 0 ? formatCurrency(proximoAjuste) : '-' }</td>
                        <td className="p-2 text-right font-mono text-text-secondary whitespace-nowrap">{formatNumber(row.clientes_projetados)}</td>
                        <td className="p-2 text-center">{isFuture ? '○' : progress >= 80 ? '🟢' : progress >= 50 ? '🟡' : '🔴'}</td>
                    </tr>
                );

                // IMPORTANT: Update the accumulated adjustment for the next iteration *after* rendering the current row.
                ajusteAcumulado = proximoAjuste;

                return rowContent;
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
    const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('bom');
    const scenarioData = projections[selectedScenario];

    const aggregatedData = useMemo(() => {
        // --- GOALS ARE DERIVED FROM THE ANNUAL GOAL (NECESSARY FUNNEL) ---
        const valor_total_contrato = funnelConfig.ticket_medio * funnelConfig.duracao_contrato_meses;
        const annualVendasGoal = valor_total_contrato > 0 ? funnelConfig.faturamento_anual_meta / valor_total_contrato : 0;

        const reunioesAnoNecessarias = funnelConfig.taxa_conversao > 0 ? annualVendasGoal / (funnelConfig.taxa_conversao / 100) : 0;
        const agendamentosAnoNecessarios = funnelConfig.taxa_comparecimento > 0 ? reunioesAnoNecessarias / (funnelConfig.taxa_comparecimento / 100) : 0;
        const annualLeadsGoal = funnelConfig.taxa_agendamento > 0 ? agendamentosAnoNecessarios / (funnelConfig.taxa_agendamento / 100) : 0;

        return {
            // Realized values
            faturamento_real: realized.monthly.reduce((s, m) => s + m.faturamento_real, 0),
            vendas_real: realized.monthly.reduce((s, m) => s + m.vendas_real, 0),
            leads_real: realized.monthly.reduce((s, m) => s + m.leads_real, 0),
            clientes_real: realized.total.clientes_real,
            
            // Goal values from funnelConfig (necessary funnel)
            faturamento_meta: funnelConfig.faturamento_anual_meta,
            vendas_meta: Math.round(annualVendasGoal),
            leads_meta: Math.round(annualLeadsGoal),
        };
    }, [realized, funnelConfig]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-card border border-border p-3 rounded-xl shadow-sm gap-4">
                <div> <label className="text-sm font-semibold text-text-secondary mr-2">Cenário (para simulação):</label> <div className="inline-grid grid-cols-3 bg-bg-subtle p-1 rounded-lg"> {(['inicial', 'bom', 'otimo'] as ScenarioType[]).map(s => ( <button key={s} onClick={() => setSelectedScenario(s)} className={`py-1 px-4 rounded-md font-bold transition-all text-sm capitalize ${selectedScenario === s ? 'bg-brand-blue text-white shadow' : 'text-text-secondary hover:text-text-main'}`}>{s}</button>))} </div> </div>
                <div> <label className="text-sm font-semibold text-text-secondary mr-2">Ano:</label> <select value={selectedYear} onChange={(e) => onYearChange(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-1 text-text-main focus:outline-none focus:ring-1 focus:ring-brand-blue text-sm"> {availableYears.map(year => <option key={year} value={year}>{year}</option>)} </select> </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GoalProgressCard title="Faturamento Ano" realized={aggregatedData.faturamento_real} goal={aggregatedData.faturamento_meta} format="currency" />
                <GoalProgressCard title="Vendas Ano" realized={aggregatedData.vendas_real} goal={aggregatedData.vendas_meta} format="number" />
                <GoalProgressCard title="Leads Ano" realized={aggregatedData.leads_real} goal={aggregatedData.leads_meta} format="number" />
            </div>

            <ChartCard title={`Detalhamento Mês a Mês (Cenário "${selectedScenario}")`} loading={false}><YearlyDetailTable realized={realized} meta={scenarioData} selectedYear={selectedYear}/></ChartCard>
        </div>
    );
};

export default TrackYearView;