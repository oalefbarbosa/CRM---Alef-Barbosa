
import React, { useMemo, useState } from 'react';
import { FunnelConfig, Projections } from '../../types';
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
  
  // Safely initialize date to the 15th of the current month in UTC to avoid timezone issues.
  const [displayedDate, setDisplayedDate] = useState(() => {
    const today = new Date();
    return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 15));
  });

  const changeMonth = (increment: number) => {
    setDisplayedDate(prevDate => {
        // Create a new date based on the previous one to avoid mutation issues.
        // Always set the day to 15 to prevent invalid dates (e.g., Feb 30th).
        const newDate = new Date(Date.UTC(prevDate.getUTCFullYear(), prevDate.getUTCMonth() + increment, 15));
        return newDate;
    });
  };

  const displayedMonthIndex = displayedDate.getUTCMonth();
  const displayedYear = displayedDate.getUTCFullYear();
  const displayedMonthName = displayedDate.toLocaleString('pt-BR', { month: 'long', timeZone: 'UTC' });

  const now = new Date();
  const isCurrentMonthView = displayedMonthIndex === now.getUTCMonth() && displayedYear === now.getUTCFullYear();
  const daysInMonth = new Date(Date.UTC(displayedYear, displayedMonthIndex + 1, 0)).getUTCDate();
  const daysRemaining = isCurrentMonthView ? daysInMonth - now.getUTCDate() : 0;
  
  const monthlyMetrics = useMemo(() => {
    // --- GOALS ARE DERIVED FROM THE ANNUAL GOAL (NECESSARY FUNNEL) ---
    const monthlyFaturamentoGoal = funnelConfig.faturamento_anual_meta / 12;
    
    const vendasAnoNecessarias = funnelConfig.ticket_medio > 0 ? funnelConfig.faturamento_anual_meta / funnelConfig.ticket_medio : 0;
    const monthlyVendasGoal = vendasAnoNecessarias / 12;
    
    const reunioesMesNecessarias = funnelConfig.taxa_conversao > 0 ? monthlyVendasGoal / (funnelConfig.taxa_conversao / 100) : 0;
    const agendamentosMesNecessarios = funnelConfig.taxa_comparecimento > 0 ? reunioesMesNecessarias / (funnelConfig.taxa_comparecimento / 100) : 0;
    const monthlyLeadsGoal = funnelConfig.taxa_agendamento > 0 ? agendamentosMesNecessarios / (funnelConfig.taxa_agendamento / 100) : 0;

    const realized = funnelConfig.ano === displayedYear && realizedData[displayedMonthIndex] 
      ? realizedData[displayedMonthIndex] 
      : { leads_real: 0, vendas_real: 0, faturamento_real: 0 };

    return {
        leads: { meta: monthlyLeadsGoal, real: realized.leads_real },
        vendas: { meta: monthlyVendasGoal, real: realized.vendas_real },
        faturamento: { meta: monthlyFaturamentoGoal, real: realized.faturamento_real }
    };
  }, [funnelConfig, realizedData, displayedMonthIndex, displayedYear]);
  
  const paceData = useMemo(() => {
    if (!isCurrentMonthView) return null;
    const totalWorkingDays = getWorkingDaysInMonth(displayedYear, displayedMonthIndex);
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