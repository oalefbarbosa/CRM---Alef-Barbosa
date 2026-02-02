
import React, { useState, useMemo } from 'react';
import { FunnelConfig, Projections, ScenarioType } from '../../types';
import PerformanceProgressCard from './PerformanceProgressCard';
import GoalVsRealizedChart from './GoalVsRealizedChart';
import RealizedFunnel from './RealizedFunnel';
import MonthlyDetailTable from './MonthlyDetailTable';

interface TrackPerformanceViewProps {
  config: FunnelConfig;
  projections: Projections;
  realized: {
      monthly: { mes: number; faturamento_real: number; vendas_real: number; leads_real: number; }[];
      total: { clientes_real: number; };
  };
  selectedYear: number;
  availableYears: number[];
  onYearChange: (year: number) => void;
}

const TrackPerformanceView: React.FC<TrackPerformanceViewProps> = ({ config, projections, realized, selectedYear, availableYears, onYearChange }) => {
    const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('inicial');
    const [chartMetric, setChartMetric] = useState<'faturamento' | 'clientes' | 'leads'>('faturamento');

    const scenarioData = projections[selectedScenario];

    // Aggregate data for the year up to the current date for cards
    const aggregatedData = useMemo(() => {
        const currentMonth = new Date().getMonth() + 1;
        const isCurrentYear = new Date().getFullYear() === selectedYear;
        const lastMonthToShow = isCurrentYear ? currentMonth : 12;

        const totals = {
            faturamento_real: 0,
            clientes_real: 0,
            leads_real: 0,
            faturamento_meta: 0,
            clientes_meta: 0, // This is the final month's projection
            leads_meta: 0,
        };

        for (let i = 0; i < lastMonthToShow; i++) {
            totals.faturamento_real += realized.monthly[i]?.faturamento_real || 0;
            totals.leads_real += realized.monthly[i]?.leads_real || 0;
            totals.faturamento_meta += scenarioData[i]?.faturamento_projetado || 0;
        }
        
        totals.clientes_meta = scenarioData[11]?.clientes_projetados || 0;
        totals.clientes_real = realized.total.clientes_real;
        
        const leadsMes = config.cpl > 0 ? config.investimento_mensal / config.cpl : 0;
        totals.leads_meta = leadsMes * 12;

        return totals;
    }, [realized, scenarioData, selectedYear, config]);

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-card border border-border p-3 rounded-xl shadow-sm gap-4">
                <div className="w-full sm:w-auto">
                    <label className="text-sm font-semibold text-text-secondary mr-2">Cenário:</label>
                    <div className="inline-grid grid-cols-3 bg-bg-subtle p-1 rounded-lg">
                        {(['inicial', 'bom', 'otimo'] as ScenarioType[]).map(s => (
                            <button key={s} onClick={() => setSelectedScenario(s)} className={`py-1 px-4 rounded-md font-bold transition-all text-sm capitalize ${selectedScenario === s ? 'bg-brand-blue text-white shadow' : 'text-text-secondary hover:text-text-main'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                 <div className="w-full sm:w-auto text-right">
                    <label className="text-sm font-semibold text-text-secondary mr-2">Ano:</label>
                     <select 
                        value={selectedYear}
                        onChange={(e) => onYearChange(Number(e.target.value))}
                        className="bg-background border border-border rounded-lg px-3 py-1 text-text-main focus:outline-none focus:ring-1 focus:ring-brand-blue text-sm"
                      >
                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                      </select>
                </div>
            </div>

            {/* Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PerformanceProgressCard 
                    title="Faturamento"
                    realized={aggregatedData.faturamento_real}
                    goal={aggregatedData.faturamento_meta}
                    format="currency"
                />
                 <PerformanceProgressCard 
                    title="Clientes"
                    realized={aggregatedData.clientes_real}
                    goal={aggregatedData.clientes_meta}
                    format="number"
                />
                 <PerformanceProgressCard 
                    title="Leads"
                    realized={aggregatedData.leads_real}
                    goal={aggregatedData.leads_meta}
                    format="number"
                />
            </div>

            {/* Main Chart */}
            <GoalVsRealizedChart 
                realizedData={realized.monthly}
                metaData={scenarioData}
                metric={chartMetric}
                setMetric={setChartMetric}
                config={config}
            />

            {/* Funnel & Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RealizedFunnel config={config} realizedData={realized.monthly} />
                <MonthlyDetailTable 
                    realizedData={realized.monthly}
                    metaData={scenarioData}
                    selectedYear={selectedYear}
                />
            </div>

        </div>
    );
};

export default TrackPerformanceView;
