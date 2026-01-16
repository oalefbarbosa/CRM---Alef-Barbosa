
import React from 'react';
import { FunnelStage, FunnelConversion } from '../types';
import { formatNumber, formatPercent } from '../utils/formatters';
import * as Icons from './Icons';

interface VisualFunnelProps {
  stages: FunnelStage[];
  conversions: FunnelConversion[];
  bottleneck: FunnelConversion | null;
  opportunity: FunnelConversion | null;
}

const STAGE_NAME_MAP: { [key: string]: string } = {
    'leads': 'Leads', 'em prospecção': 'Prospecção', 'reunião de triagem': 'Triagem',
    'reunião de proposta': 'Proposta', 'em follow up': 'Follow Up', 'em negociação': 'Negociação', 'ganho': 'Ganho'
};
const getStageName = (key: string) => STAGE_NAME_MAP[key] || key;

const VisualFunnel: React.FC<VisualFunnelProps> = ({ stages, conversions }) => {
  if (!stages || stages.length === 0) {
    return <div className="text-center text-text-secondary p-4">Dados do funil indisponíveis.</div>;
  }

  return (
    <div className="text-sm p-2">
      {stages.map((stage, index) => {
        const conversionToNext = conversions.find(c => c.from === stage.name);
        const hasSubstages = stage.subStages && stage.subStages.some(s => s.count > 0);

        return (
          <div key={stage.name}>
            {/* Main Stage Row */}
            <div className="flex justify-between items-center py-2">
              <span className="font-bold uppercase tracking-wider text-text-secondary">{getStageName(stage.name)}</span>
              <span className="font-bold text-lg text-text-main">{formatNumber(stage.count)}</span>
            </div>

            {/* Optional horizontal line for stages with sub-stages */}
            {hasSubstages && <hr className="border-slate-700/50" />}

            {/* Sub-stages */}
            {hasSubstages && (
              <div className="py-2 pl-6 text-text-secondary space-y-1">
                {stage.subStages
                  .filter(sub => sub.count > 0)
                  .map(sub => (
                    <div key={sub.name} className="flex justify-between">
                      <span>{sub.name}</span>
                      <span>{sub.count}</span>
                    </div>
                  ))
                }
              </div>
            )}
            
            {/* Conversion rate to the next stage */}
            {conversionToNext && (
              <div className="flex justify-center items-center gap-2 text-text-secondary text-xs py-3">
                <Icons.ChevronDown className="h-4 w-4" />
                <span>{formatPercent(conversionToNext.rate)}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VisualFunnel;