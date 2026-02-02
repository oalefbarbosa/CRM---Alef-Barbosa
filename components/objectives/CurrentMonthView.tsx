
import React, { useMemo } from 'react';
import { FunnelConfig } from '../../types';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';
import { getWorkingDaysInMonth, getPassedWorkingDays } from '../../utils/objectiveCalculations';
import ProgressBar from '../ProgressBar';
import ChartCard from '../ChartCard';
import * as Icons from '../Icons';

interface CurrentMonthViewProps {
  funnelConfig: FunnelConfig;
  realizedData: { mes: number, faturamento_real: number, vendas_real: number, leads_real: number, reunioes_real: number }[];
}

const ProgressCard: React.FC<{title: string, realized: number, goal: number, format: 'currency'|'number'}> = ({ title, realized, goal, format }) => {
    const percentage = goal > 0 ? (realized / goal) * 100 : 0;
    const remaining = goal - realized;
    return(
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <p className="text-sm font-bold text-text-secondary uppercase">{title}</p>
            <p className="text-3xl font-extrabold text-text-main">{format === 'currency' ? formatCurrency(realized) : formatNumber(realized)}</p>
            <p className="text-xs text-text-secondary">de {format === 'currency' ? formatCurrency(goal) : formatNumber(goal)} meta</p>
            <ProgressBar value={realized} max={goal} colorClass={percentage > 80 ? 'bg-brand-green' : percentage > 50 ? 'bg-brand-yellow' : 'bg-brand-red'} />
            <p className="text-xs text-text-secondary">Faltam: <span className="font-bold">{format === 'currency' ? formatCurrency(remaining) : formatNumber(remaining)}</span></p>
        </div>
    );
};

const CurrentMonthView: React.FC<CurrentMonthViewProps> = ({ funnelConfig, realizedData }) => {
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentMonthName = now.toLocaleString('pt-BR', { month: 'long' });
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const daysRemaining = daysInMonth - now.getDate();
  
  const monthlyMetrics = useMemo(() => {
    const leadsMes = funnelConfig.cpl > 0 ? funnelConfig.investimento_mensal / funnelConfig.cpl : 0;
    const agendamentosMes = leadsMes * (funnelConfig.taxa_agendamento / 100);
    const reunioesMes = agendamentosMes * (funnelConfig.taxa_comparecimento / 100);
    const vendasMes = reunioesMes * (funnelConfig.taxa_conversao / 100);
    const faturamentoMes = vendasMes * funnelConfig.ticket_medio;
    
    const realized = realizedData[currentMonthIndex];

    return {
        leads: { meta: leadsMes, real: realized.leads_real },
        agendamentos: { meta: agendamentosMes, real: realized.leads_real * (funnelConfig.taxa_agendamento / 100) }, // Projected real
        reunioes: { meta: reunioesMes, real: realized.reunioes_real },
        vendas: { meta: vendasMes, real: realized.vendas_real },
        faturamento: { meta: faturamentoMes, real: realized.faturamento_real }
    };
  }, [funnelConfig, realizedData, currentMonthIndex]);
  
  const paceData = useMemo(() => {
    const totalWorkingDays = getWorkingDaysInMonth(currentYear, currentMonthIndex + 1);
    const passedWorkingDays = getPassedWorkingDays();
    const remainingWorkingDays = totalWorkingDays - passedWorkingDays;

    const currentPace = {
        leads: passedWorkingDays > 0 ? monthlyMetrics.leads.real / passedWorkingDays : 0,
        reunioes: passedWorkingDays > 0 ? monthlyMetrics.reunioes.real / passedWorkingDays : 0,
        vendas: passedWorkingDays > 0 ? monthlyMetrics.vendas.real / passedWorkingDays : 0,
    };
    
    const requiredPace = {
        leads: remainingWorkingDays > 0 ? Math.max(0, monthlyMetrics.leads.meta - monthlyMetrics.leads.real) / remainingWorkingDays : Infinity,
        reunioes: remainingWorkingDays > 0 ? Math.max(0, monthlyMetrics.reunioes.meta - monthlyMetrics.reunioes.real) / remainingWorkingDays : Infinity,
        vendas: remainingWorkingDays > 0 ? Math.max(0, monthlyMetrics.vendas.meta - monthlyMetrics.vendas.real) / remainingWorkingDays : Infinity,
    };
    
    return { remainingWorkingDays, currentPace, requiredPace };
  }, [monthlyMetrics, currentYear, currentMonthIndex]);


  const FunnelRow: React.FC<{name: string, meta: number, real: number}> = ({name, meta, real}) => {
    const realPercentOfMeta = meta > 0 ? (real/meta) * 100 : 0;
    return(
        <div className="grid grid-cols-5 gap-2 items-center text-xs">
            <div className="col-span-1 font-bold text-text-main text-right">{name}</div>
            <div className="col-span-4">
                <div className="w-full bg-bg-subtle rounded-full h-5 mb-1 relative text-white font-bold text-[10px] text-center">
                    <div className="absolute left-0 top-0 h-5 bg-slate-500/50 rounded-full" style={{width: '100%'}}>{formatNumber(meta)}</div>
                    <div className="absolute left-0 top-0 h-5 bg-brand-purple rounded-full" style={{width: `${realPercentOfMeta}%`}}>{formatNumber(real)}</div>
                </div>
            </div>
        </div>
    );
  };
  
  const PaceRow: React.FC<{label: string, current: number, required: number, isGood: boolean}> = ({ label, current, required, isGood }) => (
    <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <div className="flex items-center gap-2 font-mono">
            <span>{current.toFixed(1)}/dia</span>
            <span className="text-text-secondary">vs</span>
            <span className={`font-bold ${isGood ? 'text-brand-green' : 'text-brand-red'}`}>{isFinite(required) ? required.toFixed(1) : '🚨'}/dia</span>
            {isGood ? <Icons.CheckCircle className="h-4 w-4 text-brand-green"/> : <Icons.AlertTriangle className="h-4 w-4 text-brand-red"/>}
        </div>
    </div>
  );

  return (
    <div className="space-y-6">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-text-main capitalize">{currentMonthName} {currentYear}</h2>
            <p className="text-text-secondary">Faltam {daysRemaining} dias para o fim do mês.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ProgressCard title="Leads" realized={monthlyMetrics.leads.real} goal={monthlyMetrics.leads.meta} format="number" />
            <ProgressCard title="Reuniões" realized={monthlyMetrics.reunioes.real} goal={monthlyMetrics.reunioes.meta} format="number" />
            <ProgressCard title="Vendas" realized={monthlyMetrics.vendas.real} goal={monthlyMetrics.vendas.meta} format="number" />
            <ProgressCard title="Faturamento" realized={monthlyMetrics.faturamento.real} goal={monthlyMetrics.faturamento.meta} format="currency" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Funil do Mês (Real vs Meta)" loading={false}><div className="space-y-3 p-2">
                <FunnelRow name="Leads" meta={monthlyMetrics.leads.meta} real={monthlyMetrics.leads.real} />
                <FunnelRow name="Agendados" meta={monthlyMetrics.agendamentos.meta} real={monthlyMetrics.agendamentos.real} />
                <FunnelRow name="Reuniões" meta={monthlyMetrics.reunioes.meta} real={monthlyMetrics.reunioes.real} />
                <FunnelRow name="Vendas" meta={monthlyMetrics.vendas.meta} real={monthlyMetrics.vendas.real} />
            </div></ChartCard>
            <ChartCard title="📈 Ritmo Para Bater a Meta" loading={false}><div className="space-y-3 p-2">
                <p className="text-sm text-text-secondary text-center mb-4">Faltam <span className="font-bold text-text-main">{paceData.remainingWorkingDays}</span> dias úteis no mês.</p>
                <PaceRow label="• Ritmo de Leads" current={paceData.currentPace.leads} required={paceData.requiredPace.leads} isGood={paceData.currentPace.leads >= paceData.requiredPace.leads} />
                <PaceRow label="• Ritmo de Reuniões" current={paceData.currentPace.reunioes} required={paceData.requiredPace.reunioes} isGood={paceData.currentPace.reunioes >= paceData.requiredPace.reunioes} />
                <PaceRow label="• Ritmo de Vendas" current={paceData.currentPace.vendas} required={paceData.requiredPace.vendas} isGood={paceData.currentPace.vendas >= paceData.requiredPace.vendas} />
            </div></ChartCard>
        </div>
    </div>
  );
};

export default CurrentMonthView;
