
import React from 'react';
import { FunnelStage, FunnelConversion } from '../types';
import { formatNumber, formatPercent } from '../utils/formatters';

interface VisualFunnelProps {
  stages: FunnelStage[];
  conversions: FunnelConversion[];
  bottleneck: FunnelConversion | null;
  opportunity: FunnelConversion | null;
}

const STAGE_NAME_MAP: { [key: string]: string } = {
    'leads': 'Novos Leads', 
    'em prospecção': 'Em Prospecção', 
    'reunião de triagem': 'Triagem',
    'reunião de proposta': 'Reunião de Proposta', 
    'em follow up': 'Follow Up', 
    'em negociação': 'Em Negociação', 
    'ganho': 'Vendas Fechadas'
};

const STAGE_COLORS: { [key: string]: string } = {
    'leads': 'bg-slate-500',
    'em prospecção': 'bg-blue-500',
    'reunião de triagem': 'bg-indigo-500',
    'reunião de proposta': 'bg-purple-500',
    'em follow up': 'bg-orange-500',
    'em negociação': 'bg-yellow-500',
    'ganho': 'bg-green-500'
};

const getStageName = (key: string) => STAGE_NAME_MAP[key] || key;

const VisualFunnel: React.FC<VisualFunnelProps> = ({ stages, conversions }) => {
  if (!stages || stages.length === 0) {
    return <div className="text-center text-text-secondary p-4">Dados do funil indisponíveis.</div>;
  }

  // Find max count to normalize bar widths (Lead stage usually)
  const maxCount = Math.max(...stages.map(s => s.count));

  return (
    <div className="flex flex-col h-full py-2">
      <div className="space-y-3 sm:space-y-1">
        {stages.map((stage, index) => {
          const conversionToNext = conversions.find(c => c.from === stage.name);
          // Calculate width relative to maxCount, minimum 20% so text fits
          const widthPercent = Math.max(20, (stage.count / maxCount) * 100);
          const colorClass = STAGE_COLORS[stage.name] || 'bg-slate-600';
          
          return (
            <div key={stage.name} className="relative group">
               {/* Connector Line - Hidden on mobile to save space/reduce noise */}
               {index < stages.length - 1 && (
                  <div className="hidden sm:block absolute left-8 top-full h-8 w-0.5 bg-slate-700/50 -z-10"></div>
               )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                 
                 {/* Visual Bar */}
                 <div className="flex-grow">
                    <div 
                        className={`h-10 sm:h-12 rounded-r-lg flex items-center justify-between px-3 sm:px-4 shadow-lg transition-all duration-500 ${colorClass}`}
                        style={{ width: `${widthPercent}%` }}
                    >
                        <span className="font-bold text-white text-xs sm:text-base whitespace-nowrap drop-shadow-md truncate pr-2">
                            {getStageName(stage.name)}
                        </span>
                        <span className="font-extrabold text-white text-sm sm:text-lg drop-shadow-md bg-black/20 px-1.5 sm:px-2 rounded">
                            {formatNumber(stage.count)}
                        </span>
                    </div>
                 </div>

                 {/* Conversion Badge (Right Side) */}
                 {conversionToNext && (
                     <div className="flex-shrink-0 sm:w-24 text-left sm:text-right pl-3 sm:pl-0">
                         <div className="flex items-center sm:flex-col sm:items-end gap-2 sm:gap-0">
                            <span className="text-[10px] text-slate-500 uppercase sm:hidden">Conv:</span>
                            <span className={`text-xs sm:text-sm font-bold ${conversionToNext.rate < 20 ? 'text-red-400' : 'text-slate-400'}`}>
                                {formatPercent(conversionToNext.rate)}
                            </span>
                            <span className="hidden sm:inline text-[10px] text-slate-500 uppercase">Conversão</span>
                         </div>
                     </div>
                 )}
              </div>

              {/* Spacer on Desktop */}
              {index < stages.length - 1 && (
                  <div className="hidden sm:block h-4"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VisualFunnel;
