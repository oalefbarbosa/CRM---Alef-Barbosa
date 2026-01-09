
import React, { useMemo } from 'react';
import { CrmData } from '../../types';
import { formatPercent } from '../../utils/formatters';
import { AlertTriangle, CheckCircle, ChevronDown, BarChart, Target } from '../Icons';

interface ConversionRateFunnelProps {
  data: CrmData[];
}

// FIX: Define benchmarks outside the component so it's accessible in both useMemo and the render body.
const benchmarks = {
    'Em Prospecção': { min: 40, max: 60 },
    'Reunião de Proposta': { min: 20, max: 35 },
    'Cliente Fechado': { min: 30, max: 50 }
};

const ConversionRateFunnel: React.FC<ConversionRateFunnelProps> = ({ data }) => {
  const funnelData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const prospecçaoStatuses = ['em prospecção', 'reunião de proposta', 'em follow up', 'ganho'];
    const reuniaoStatuses = ['reunião de proposta', 'em follow up', 'ganho'];

    const totalLeads = data.length;
    const prospecçaoCount = data.filter(l => prospecçaoStatuses.includes(l.status)).length;
    const reuniaoCount = data.filter(l => reuniaoStatuses.includes(l.status)).length;
    const ganhoCount = data.filter(l => l.status === 'ganho').length;

    const stages = [
      { name: 'Novos Leads', count: totalLeads },
      { name: 'Em Prospecção', count: prospecçaoCount },
      { name: 'Reunião de Proposta', count: reuniaoCount },
      { name: 'Cliente Fechado', count: ganhoCount },
    ];

    const conversions = [];
    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i];
      const toStage = stages[i+1];
      const rate = fromStage.count > 0 ? (toStage.count / fromStage.count) * 100 : 0;
      
      const benchmark = benchmarks[toStage.name as keyof typeof benchmarks];
      let status: 'good' | 'average' | 'bad' = 'average';
      if (benchmark) {
          if (rate < benchmark.min) status = 'bad';
          if (rate >= benchmark.min) status = 'good';
      }

      conversions.push({
        from: fromStage.name,
        to: toStage.name,
        rate: rate,
        fromCount: fromStage.count,
        toCount: toStage.count,
        status: status
      });
    }

    const bottleneck = conversions.length > 0 ? conversions.reduce((min, current) => (current.rate < min.rate ? current : min)) : null;

    const wonLeads = ganhoCount;
    const lostLeads = data.filter(d => d.status === 'perdido').length;
    const totalClosed = wonLeads + lostLeads;
    const globalConversion = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
    const winRate = totalClosed > 0 ? (wonLeads / totalClosed) * 100 : 0;


    return { stages, conversions, bottleneck, globalConversion, winRate };
  }, [data]);

  if (!funnelData) {
    return <div className="text-center text-text-secondary">Não há dados suficientes para exibir o funil.</div>;
  }

  const { stages, conversions, bottleneck, globalConversion, winRate } = funnelData;

  const funnelColors = ['#3b82f6', '#6366f1', '#a855f7', '#22c55e'];

  const getStatusInfo = (status: 'good' | 'average' | 'bad') => {
      switch(status) {
          case 'good': return { icon: <CheckCircle className="h-4 w-4 text-brand-green"/>, label: "Bom", textColor: "text-brand-green"};
          case 'bad': return { icon: <AlertTriangle className="h-4 w-4 text-brand-red"/>, label: "Gargalo", textColor: "text-brand-red"};
          default: return { icon: null, label: "", textColor: "text-text-secondary"};
      }
  }

  return (
    <div className="p-2 sm:p-4 space-y-4">
      {stages.map((stage, index) => (
        <React.Fragment key={stage.name}>
          <div className="sm:flex sm:items-center sm:gap-4 space-y-2 sm:space-y-0">
            <div className="flex-none sm:w-48 sm:text-right text-sm font-semibold text-text-main">{stage.name}</div>
            <div className="flex-grow flex items-center gap-3">
              <div
                className="h-8 rounded-r-md flex items-center pr-3 justify-end w-full"
                style={{
                  width: `${(stage.count / stages[0].count) * 100}%`,
                  backgroundColor: funnelColors[index],
                  minWidth: '50px'
                }}
              >
                <span className="text-lg font-bold text-white mix-blend-hard-light">{stage.count}</span>
              </div>
            </div>
          </div>
          {index < conversions.length && (
            <div className="flex items-start gap-2 sm:gap-4 sm:pl-[212px] my-2">
                <ChevronDown className="h-5 w-5 text-text-secondary mt-0.5 flex-shrink-0" />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="text-sm">
                        <span className={`font-bold ${getStatusInfo(conversions[index].status).textColor}`}>{formatPercent(conversions[index].rate)}</span>
                        <span className="text-text-secondary"> converteram ({conversions[index].toCount} de {conversions[index].fromCount})</span>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusInfo(conversions[index].status).textColor}`}>
                        {getStatusInfo(conversions[index].status).icon}
                        <span>{getStatusInfo(conversions[index].status).label}</span>
                    </div>
                </div>
            </div>
          )}
        </React.Fragment>
      ))}

      <div className="mt-8 pt-6 border-t border-border space-y-6">
        <div className="bg-slate-800/50 p-4 rounded-lg">
            <h4 className="text-sm font-bold text-text-main mb-2 flex items-center gap-2"><BarChart className="h-5 w-5 text-brand-cyan" />Resumo das Conversões</h4>
            <ul className="text-sm space-y-1 text-text-secondary">
                {conversions.map(c => (
                    <li key={c.to}>• <span className="font-semibold text-text-main">{c.from} → {c.to}:</span> {formatPercent(c.rate)}</li>
                ))}
            </ul>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                <div>
                    <p className="text-xs text-text-secondary">Taxa de Conversão Global</p>
                    <p className="font-bold text-lg text-brand-cyan">{formatPercent(globalConversion)}</p>
                </div>
                <div>
                    <p className="text-xs text-text-secondary">Win Rate (de finalizados)</p>
                    <p className="font-bold text-lg text-brand-green">{formatPercent(winRate)}</p>
                </div>
            </div>
        </div>

        {bottleneck && bottleneck.status === 'bad' && (
            <div className="bg-orange-900/40 border border-brand-orange/50 p-4 rounded-lg">
                <h4 className="text-sm font-bold text-brand-orange mb-2 flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Insight & Ação Recomendada</h4>
                <p className="text-sm text-orange-200">
                    O maior gargalo está na conversão de <span className="font-bold">{bottleneck.from}</span> para <span className="font-bold">{bottleneck.to}</span>, onde apenas <span className="font-bold">{formatPercent(bottleneck.rate)}</span> dos leads avançam.
                </p>
                <p className="text-sm text-orange-200 mt-2">
                    <span className="font-bold">Ação:</span> Revisar a abordagem de qualificação e agendamento de reuniões para aumentar esta taxa. A meta deve ser subir para pelo menos {benchmarks[bottleneck.to as keyof typeof benchmarks].min}%.
                </p>
            </div>
        )}
      </div>

    </div>
  );
};

export default ConversionRateFunnel;