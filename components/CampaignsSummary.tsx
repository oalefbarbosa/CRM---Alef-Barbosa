
import React from 'react';
import { CampaignData, CampaignKpis, CrmKpis } from '../types';
import * as Icons from './Icons';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import ProgressBar from './ProgressBar';

interface CampaignsSummaryProps {
  campaignKpis: CampaignKpis;
  crmKpis: CrmKpis;
  campaignData: CampaignData[];
}

interface MetricProfile {
  colorClass: string;
  bgColorClass: string;
  textColorClass: string;
  label: string;
}

const getMetricProfile = (type: 'cpl' | 'ctr' | 'roi', value: number): MetricProfile => {
  const profiles = {
    cpl: [
      { threshold: 5, profile: { colorClass: 'bg-brand-green', bgColorClass: 'bg-green-500/10', textColorClass: 'text-brand-green', label: 'Ótimo' } },
      { threshold: 10, profile: { colorClass: 'bg-brand-yellow', bgColorClass: 'bg-yellow-500/10', textColorClass: 'text-brand-yellow', label: 'Bom' } },
      { threshold: Infinity, profile: { colorClass: 'bg-brand-red', bgColorClass: 'bg-red-500/10', textColorClass: 'text-brand-red', label: 'Atenção' } }
    ],
    ctr: [
      { threshold: 10, profile: { colorClass: 'bg-brand-yellow', bgColorClass: 'bg-yellow-500/10', textColorClass: 'text-brand-yellow', label: 'Bom' } },
      { threshold: 15, profile: { colorClass: 'bg-brand-green', bgColorClass: 'bg-green-500/10', textColorClass: 'text-brand-green', label: 'Ótimo' } }
    ],
    roi: [
      { threshold: 100, profile: { colorClass: 'bg-brand-yellow', bgColorClass: 'bg-yellow-500/10', textColorClass: 'text-brand-yellow', label: 'Bom' } },
      { threshold: 200, profile: { colorClass: 'bg-brand-green', bgColorClass: 'bg-green-500/10', textColorClass: 'text-brand-green', label: 'Ótimo' } }
    ]
  };

  if (type === 'ctr' || type === 'roi') {
    for (let i = profiles[type].length - 1; i >= 0; i--) {
      if (value >= profiles[type][i].threshold) return profiles[type][i].profile;
    }
    return { colorClass: 'bg-brand-red', bgColorClass: 'bg-red-500/10', textColorClass: 'text-brand-red', label: 'Atenção' };
  } else { // CPL is lower is better
    for (const item of profiles.cpl) {
      if (value <= item.threshold) return item.profile;
    }
  }
  return { colorClass: 'bg-slate-500', bgColorClass: 'bg-slate-500/10', textColorClass: 'text-slate-400', label: 'N/A' };
};


export const CampaignsSummary: React.FC<CampaignsSummaryProps> = ({ campaignKpis, crmKpis, campaignData }) => {
  const cplProfile = getMetricProfile('cpl', campaignKpis.avgCPL);
  const ctrProfile = getMetricProfile('ctr', campaignKpis.avgCTR);
  const roiProfile = getMetricProfile('roi', campaignKpis.roi);

  const EfficiencyMetric: React.FC<{ title: string, value: string, profile: MetricProfile, barValue: number, barMax: number }> = ({ title, value, profile, barValue, barMax }) => (
    <div className={`grid grid-cols-12 items-center gap-4 p-3 rounded-lg ${profile.bgColorClass}`}>
        <div className="col-span-2 text-sm font-semibold text-text-secondary">{title}</div>
        <div className="col-span-4"><ProgressBar value={barValue} max={barMax} colorClass={profile.colorClass} /></div>
        <div className={`col-span-3 text-lg font-bold ${profile.textColorClass}`}>{value}</div>
        <div className={`col-span-3 text-sm font-semibold ${profile.textColorClass}`}>{profile.label}</div>
    </div>
  );

  return (
    <section>
        <h2 className="text-xl font-bold mb-4 text-slate-200 uppercase tracking-wider">Performance de Campanhas</h2>
        <div className="bg-card border border-border rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-border pb-6 mb-6">
                <div>
                    <h3 className="text-sm font-semibold uppercase text-text-secondary mb-2">Investimento</h3>
                    <p className="text-4xl font-extrabold text-brand-purple">{formatCurrency(campaignKpis.totalSpent)}</p>
                    <p className="text-text-secondary mt-1">Em {campaignKpis.totalCampaigns} campanhas</p>
                </div>
                <div>
                    <h3 className="text-sm font-semibold uppercase text-text-secondary mb-2">Resultados</h3>
                    <p className="text-4xl font-extrabold text-brand-cyan">{formatNumber(campaignKpis.totalLeads)} <span className="text-2xl font-bold">leads gerados</span></p>
                    <p className="text-text-secondary mt-1">{crmKpis.wonLeads} cliente(s) fechado(s) via campanhas</p>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold uppercase text-text-secondary mb-3">Eficiência</h3>
                <div className="space-y-3">
                    <EfficiencyMetric title="CPL" value={formatCurrency(campaignKpis.avgCPL)} profile={cplProfile} barValue={10} barMax={Math.max(10, campaignKpis.avgCPL)} />
                    <EfficiencyMetric title="CTR" value={formatPercent(campaignKpis.avgCTR)} profile={ctrProfile} barValue={campaignKpis.avgCTR} barMax={20} />
                    <EfficiencyMetric title="ROI" value={formatPercent(campaignKpis.roi)} profile={roiProfile} barValue={campaignKpis.roi} barMax={400}/>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center mt-6 pt-6 border-t border-border">
                <div>
                    <p className="text-xs text-text-secondary">Alcance</p>
                    <p className="font-bold text-lg">{formatNumber(campaignKpis.totalReach)}</p>
                </div>
                 <div>
                    <p className="text-xs text-text-secondary">Impressões</p>
                    <p className="font-bold text-lg">{formatNumber(campaignKpis.totalImpressions)}</p>
                </div>
                 <div>
                    <p className="text-xs text-text-secondary">CPC Médio</p>
                    <p className="font-bold text-lg">{formatCurrency(campaignKpis.avgCPC)}</p>
                </div>
            </div>

        </div>
    </section>
  );
};