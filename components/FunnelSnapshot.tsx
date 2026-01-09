
import React, { useMemo } from 'react';
import { CrmData } from '../types';
import * as Icons from './Icons';

interface FunnelSnapshotProps {
  data: CrmData[];
}

const funnelStageOrder = ['em prospecção', 'reunião de proposta', 'em follow up', 'em negociação', 'ganho'];
const stageOrderMap = new Map(funnelStageOrder.map((stage, i) => [stage, i]));

const stageLabels: { [key: string]: string } = {
  'em prospecção': 'Prospecção',
  'reunião de proposta': 'Reunião',
  'em follow up': 'Follow Up',
  'em negociação': 'Negociação',
  'ganho': 'Ganho'
};


export const FunnelSnapshot: React.FC<FunnelSnapshotProps> = ({ data }) => {
  const funnelData = useMemo(() => {
    const totalLeads = data.length;
    if (totalLeads === 0) return { stages: [], bottleneck: null };

    const stageCounts = Array(funnelStageOrder.length).fill(0);

    for (const lead of data) {
      const stageIndex = stageOrderMap.get(lead.status);
      if (stageIndex !== undefined) {
        for (let i = 0; i <= stageIndex; i++) {
          stageCounts[i]++;
        }
      }
    }

    const stages = [
      {
        name: 'Leads',
        count: totalLeads,
        percentage: 100
      },
      ...funnelStageOrder.map((stage, index) => ({
        name: stageLabels[stage],
        count: stageCounts[index],
        percentage: totalLeads > 0 ? (stageCounts[index] / totalLeads) * 100 : 0
      }))
    ];

    let bottleneck = null;
    let maxDrop = 0;
    for (let i = 0; i < stages.length - 1; i++) {
      const drop = stages[i].count - stages[i+1].count;
      if (drop > maxDrop) {
        maxDrop = drop;
        const dropPercentage = stages[i].count > 0 ? (drop / stages[i].count) * 100 : 0;
        bottleneck = `Gargalo: ${dropPercentage.toFixed(0)}% dos leads não avançam de ${stages[i].name} para ${stages[i+1].name}.`;
      }
    }

    return { stages, bottleneck };
  }, [data]);
  
  const funnelColors = ['#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f97316', '#22c55e'];

  return (
    <section>
      <h2 className="text-xl font-bold mb-4 text-slate-200 uppercase tracking-wider">Snapshot do Funil de Vendas</h2>
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <div className="space-y-3">
          {funnelData.stages.map((stage, index) => (
            <div key={stage.name} className="grid grid-cols-12 gap-x-2 sm:gap-x-4 items-center">
              <div className="col-span-4 sm:col-span-2 text-sm font-semibold text-text-secondary truncate">{stage.name}</div>
              <div className="col-span-6 sm:col-span-8">
                 <div className="w-full bg-slate-700 rounded-full h-6">
                    <div
                        className="h-6 rounded-full transition-all duration-500 ease-out flex items-center pr-2 justify-end"
                        style={{ width: `${stage.percentage}%`, backgroundColor: funnelColors[index] || '#64748b' }}
                    >
                        <span className="text-xs font-bold text-white mix-blend-difference">{stage.count}</span>
                    </div>
                 </div>
              </div>
              <div className="col-span-2 text-right font-mono text-xs sm:text-sm text-text-main">{stage.percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>
        {funnelData.bottleneck && (
            <div className="mt-6 pt-4 border-t border-border flex items-start sm:items-center gap-2 text-brand-orange">
                <Icons.AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 sm:mt-0" />
                <p className="text-sm font-semibold">{funnelData.bottleneck}</p>
            </div>
        )}
      </div>
    </section>
  );
};