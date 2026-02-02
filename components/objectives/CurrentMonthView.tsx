
import React, { useMemo, useState } from 'react';
import { FunnelConfig, Projections, ScenarioType } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { getWorkingDaysInMonth, getPassedWorkingDays } from '../../utils/objectiveCalculations';
import ChartCard from '../ChartCard';
import * as Icons from '../Icons';
import GoalProgressCard from './GoalProgressCard';

interface CurrentMonthViewProps {
  funnelConfig: FunnelConfig;
  realizedData: { mes: number, faturamento_real: number, vendas_real: number, leads_real: number, reunioes_real: number }[];
  projections: Projections;
}

const CurrentMonthView: React.FC<CurrentMonthViewProps> = ({ funnelConfig, realizedData, projections }) => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('bom');
  const [displayedDate, setDisplayedDate] = useState(new Date());

  const changeMonth = (increment: number) => {
    setDisplayedDate(prevDate => {
        const newDate = new Date(prevDate);
        newDate.setMonth(prevDate.getMonth() + increment);
        return newDate;
    });
  };

  const displayedMonthIndex = displayedDate.getMonth();
  const displayedYear = displayedDate.getFullYear();
  const displayedMonthName = displayedDate.toLocaleString('pt-BR', { month: 'long' });

  const now = new Date();
  const isCurrentMonthView = displayedMonthIndex === now.getMonth() && displayedYear === now.getFullYear();

  const daysInMonth = new Date(displayedYear, displayedMonthIndex + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate();
  
  const monthlyMetrics = useMemo(() => {
    const leadsMesMetaFunil = funnelConfig.cpl > 0 ? funnelConfig.investimento_mensal / funnelConfig.cpl : 0;
    const vendasMesMetaFunil = leadsMesMetaFunil * (funnelConfig.taxa_agendamento / 100) * (funnelConfig.taxa_comparecimento / 100) * (funnelConfig.taxa_conversao / 100);
    
    // Ensure we don't go out of bounds if projections are only for one year
    const projectionIndex = funnelConfig.ano === displayedYear ? displayedMonthIndex : -1;
    const metaFromScenario = projectionIndex !== -1 ? projections[selectedScenario][projectionIndex] : { faturamento_projetado: 0 };
    const realized = funnelConfig.ano === displayedYear ? realizedData[displayedMonthIndex] : { leads_real: 0, vendas_real: 0, faturamento_real: 0 };

    return {
        leads: { meta: leadsMesMetaFunil, real: realized.leads_real },
        vendas: { meta: vendasMesMetaFunil, real: realized.vendas_real },
        faturamento: { meta: metaFromScenario.faturamento_projetado, real: realized.faturamento_real }
    };
  }, [funnelConfig, realizedData, displayedMonthIndex, displayedYear, projections, selectedScenario]);
  
  const paceData = useMemo(() => {
    if (!isCurrentMonthView) return null;
    const totalWorkingDays = getWorkingDaysInMonth(displayedYear, displayedMonthIndex + 1);
    const passedWorkingDays = getPassedWorkingDays();
    const remainingWorkingDays = totalWorkingDays - passedWorkingDays;
    
    const requiredPace = {
        leads: remainingWorkingDays > 0 ? Math.max(0, monthlyMetrics.leads.meta - monthlyMetrics.leads.real) / remainingWorkingDays : Infinity,
        vendas: remainingWorkingDays > 0 ? Math.max(0, monthlyMetrics.vendas.meta - monthlyMetrics.vendas.real) / remainingWorkingDays : Infinity,
    };
    
    return { remainingWorkingDays, requiredPace };
  }, [monthlyMetrics, displayedYear, displayedMonthIndex, isCurrentMonthView]);

  return (
    <div className="space-y-6">
        <div className="text-center">
            <div className="flex items-center justify-center gap-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-bg-subtle transition-colors" aria-label="Mês anterior">
                    <Icons.ChevronLeft className="h-6 w-6 text-text-secondary"/>
                </button>
                <h2 className="text-3xl font-bold text-text-main capitalize w-64">{displayedMonthName} {displayedYear}</h2>
                 <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-bg-subtle transition-colors" aria-label="Próximo mês">
                    <Icons.ChevronRight className="h-6 w-6 text-text-secondary"/>
                </button>
            </div>
            {isCurrentMonthView && <p className="text-text-secondary">Faltam {daysRemaining} dias para o fim do mês.</p>}
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center bg-card border border-border p-3 rounded-xl shadow-sm gap-4">
            <div>
                <label className="text-sm font-semibold text-text-secondary mr-2">Cenário:</label>
                <div className="inline-grid grid-cols-3 bg-bg-subtle p-1 rounded-lg">
                    {(['inicial', 'bom', 'otimo'] as ScenarioType[]).map(s => (
                        <button key={s} onClick={() => setSelectedScenario(s)} className={`py-1 px-4 rounded-md font-bold transition-all text-sm capitalize ${selectedScenario === s ? 'bg-brand-blue text-white shadow' : 'text-text-secondary hover:text-text-main'}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GoalProgressCard title="Faturamento Mês" realized={monthlyMetrics.faturamento.real} goal={monthlyMetrics.faturamento.meta} format="currency" />
            <GoalProgressCard title="Vendas Mês" realized={monthlyMetrics.vendas.real} goal={monthlyMetrics.vendas.meta} format="number" />
            <GoalProgressCard title="Leads Mês" realized={monthlyMetrics.leads.real} goal={monthlyMetrics.leads.meta} format="number" />
        </div>

        {paceData && (
            <ChartCard title="📈 Ritmo Para Bater a Meta" loading={false}>
                <div className="space-y-4 p-2 text-center">
                    <p className="text-sm text-text-secondary">Faltam <span className="font-bold text-text-main">{paceData.remainingWorkingDays}</span> dias úteis no mês.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-bg-subtle p-3 rounded-lg">
                            <p className="text-xs text-text-secondary">Leads/dia necessários</p>
                            <p className="text-2xl font-bold text-brand-orange">{isFinite(paceData.requiredPace.leads) ? paceData.requiredPace.leads.toFixed(1) : '🚨'}</p>
                        </div>
                         <div className="bg-bg-subtle p-3 rounded-lg">
                            <p className="text-xs text-text-secondary">Vendas/dia necessárias</p>
                            <p className="text-2xl font-bold text-brand-orange">{isFinite(paceData.requiredPace.vendas) ? paceData.requiredPace.vendas.toFixed(1) : '🚨'}</p>
                        </div>
                    </div>
                </div>
            </ChartCard>
        )}
    </div>
  );
};

export default CurrentMonthView;