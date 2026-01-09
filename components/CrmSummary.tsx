import React, { useMemo, useCallback } from 'react';
import { CrmData, CrmKpis } from '../types';
import * as Icons from './Icons';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import ProgressBar from './ProgressBar';
import { useChart } from './charts/BaseChart';
import type { ChartConfiguration, ChartData } from 'chart.js';

interface CrmSummaryProps {
  kpis: CrmKpis;
  data: CrmData[];
}

// Mini Donut Chart for the Total Leads Card
const LeadsStatusDonutChart: React.FC<{ kpis: CrmKpis }> = ({ kpis }) => {
  const configFactory = useCallback((): ChartConfiguration => {
    const chartData: ChartData = {
      labels: ['Ativos', 'Perdidos', 'Ganhos'],
      datasets: [{
        data: [kpis.activeLeads, kpis.lostLeads, kpis.wonLeads],
        backgroundColor: ['#22d3d8', '#ef4444', '#22c55e'],
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
          legend: { display: false },
          tooltip: { enabled: false },
        },
      },
    };
  }, [kpis]);
  
  const canvasRef = useChart(configFactory, kpis);
  return <div className="absolute right-0 bottom-0 h-20 w-20 p-2"><canvas ref={canvasRef} /></div>;
};

// --- Hero Cards ---

const TotalLeadsCard: React.FC<CrmSummaryProps> = ({ kpis }) => {
    const total = kpis.totalLeads;
    const activePct = total > 0 ? (kpis.activeLeads / total) * 100 : 0;
    const lostPct = total > 0 ? (kpis.lostLeads / total) * 100 : 0;
    const wonPct = total > 0 ? (kpis.wonLeads / total) * 100 : 0;
    
    return (
        <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between h-[220px] relative">
            <div>
                <p className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-2">👥 Total de Leads</p>
                <p className="text-4xl sm:text-5xl font-extrabold text-text-main">{kpis.totalLeads}</p>
            </div>
            <div>
                <p className="text-sm font-medium"><span className="text-brand-cyan">● Ativos:</span> {kpis.activeLeads} ({formatPercent(activePct)})</p>
                <p className="text-sm font-medium"><span className="text-brand-red">● Perdidos:</span> {kpis.lostLeads} ({formatPercent(lostPct)})</p>
                <p className="text-sm font-medium"><span className="text-brand-green">● Ganhos:</span> {kpis.wonLeads} ({formatPercent(wonPct)})</p>
            </div>
            <LeadsStatusDonutChart kpis={kpis} />
        </div>
    );
};

const CrmConversionCard: React.FC<CrmSummaryProps> = ({ kpis }) => {
    const CONVERSION_GOAL = 15; // 15% goal
    const totalClosed = kpis.wonLeads + kpis.lostLeads;
    const goalDiff = kpis.conversionRate - CONVERSION_GOAL;
    const goalDiffColor = goalDiff >= 0 ? 'text-brand-green' : 'text-brand-red';

    return (
        <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between h-[220px]">
            <div>
                <p className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-2">🎯 Taxa de Conversão</p>
                <p className="text-4xl sm:text-5xl font-extrabold text-text-main">{formatPercent(kpis.conversionRate)}</p>
            </div>
            <div>
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-text-secondary">{formatPercent(kpis.conversionRate)} de {formatPercent(CONVERSION_GOAL)}</span>
                    <span className={`text-xs font-bold ${goalDiffColor}`}>{goalDiff.toFixed(2)} pts</span>
                </div>
                <ProgressBar value={kpis.conversionRate} max={CONVERSION_GOAL} colorClass="bg-brand-green" />
                <p className="text-sm text-text-secondary mt-2">{kpis.wonLeads} ganho(s) / {totalClosed} finalizado(s)</p>
            </div>
        </div>
    );
};

const CrmPipelineCard: React.FC<CrmSummaryProps> = ({ kpis, data }) => {
    const MONTHLY_GOAL = 20000;
    const negotiationValue = useMemo(() => data
        .filter(d => d.status === 'em negociação')
        .reduce((sum, lead) => sum + lead.valor, 0), [data]);
    const remaining = Math.max(0, MONTHLY_GOAL - kpis.wonValue);

    return (
        <div className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between h-[220px]">
            <div>
                <p className="text-sm font-semibold uppercase text-text-secondary tracking-wider mb-2">💰 Pipeline Ativo</p>
                <p className="text-4xl sm:text-5xl font-extrabold text-text-main">{formatCurrency(kpis.totalPipeline)}</p>
            </div>
            <div>
                <div className="flex justify-between items-baseline mb-1">
                     <span className="text-xs text-text-secondary">Meta Mensal: {formatCurrency(MONTHLY_GOAL)}</span>
                </div>
                <ProgressBar value={kpis.wonValue} max={MONTHLY_GOAL} colorClass="bg-brand-purple" />
                 <div className="text-sm text-text-secondary mt-2 space-y-1">
                    <p>• <span className="font-semibold text-text-main">Em negociação:</span> {formatCurrency(negotiationValue)}</p>
                    <p>• <span className="font-semibold text-text-main">Valor Ganho:</span> {formatCurrency(kpis.wonValue)}</p>
                    <p>• <span className="font-semibold text-text-main">Faltam:</span> {formatCurrency(remaining)}</p>
                </div>
            </div>
        </div>
    );
};

const CrmLostValueCard: React.FC<CrmSummaryProps> = ({ kpis, data }) => {
    const topReasons = useMemo(() => {
        const lostLeads = data.filter(lead => lead.status === 'perdido' && lead.motivoPerda && lead.motivoPerda !== 'N/A');
        const totalLostWithReason = lostLeads.length;
        if (totalLostWithReason === 0) return [];

        const reasonCounts = lostLeads.reduce((acc, lead) => {
            const reason = lead.motivoPerda.trim();
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        return Object.entries(reasonCounts)
            // FIX: Explicitly cast sort operands to Number to prevent type errors.
            .sort((a, b) => Number(b[1]) - Number(a[1]))
            .slice(0, 3)
            .map(([reason, count]) => ({
                reason,
                // FIX: Explicitly cast division operands to Number to prevent type errors.
                percentage: (Number(count) / totalLostWithReason) * 100,
            }));
    }, [data]);

    return (
        <div className="bg-red-900/50 border border-red-500/60 p-6 rounded-xl flex flex-col justify-between h-[220px]">
             <div>
                <p className="text-sm font-semibold uppercase text-red-300 tracking-wider mb-2 flex items-center">
                    <span className="relative flex h-3 w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Valor Perdido
                </p>
                <p className="text-4xl sm:text-5xl font-extrabold text-text-main">{formatCurrency(kpis.lostValue)}</p>
                <p className="text-sm text-red-300 mt-1">{formatPercent(kpis.lossRate)} de taxa de perda ({kpis.lostLeads} leads)</p>
            </div>
            <div>
                <p className="text-xs uppercase font-bold text-red-300">Top Motivos:</p>
                <ul className="text-sm text-red-200 mt-1 space-y-0.5">
                    {topReasons.length > 0 ? topReasons.map(r => (
                        <li key={r.reason}>• {r.reason} ({formatPercent(r.percentage)})</li>
                    )) : <li>Nenhum motivo registrado.</li>}
                </ul>
            </div>
        </div>
    );
};


export const CrmSummary: React.FC<CrmSummaryProps> = ({ kpis, data }) => {
  return (
    <section>
        <h2 className="text-xl font-bold mb-4 text-slate-200 uppercase tracking-wider">KPIs Principais de CRM</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <TotalLeadsCard kpis={kpis} data={data} />
            <CrmConversionCard kpis={kpis} data={data} />
            <CrmPipelineCard kpis={kpis} data={data} />
            <CrmLostValueCard kpis={kpis} data={data} />
        </div>
    </section>
  );
};
