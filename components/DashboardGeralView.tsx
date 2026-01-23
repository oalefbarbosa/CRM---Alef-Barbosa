
import React, { useState } from 'react';
import { CrmData, DashboardGeralMetrics } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import * as Icons from './Icons';
import VisualFunnel from './VisualFunnel';
import ChartCard from './ChartCard';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import SalesFunnelByStatusChart from './charts/SalesFunnelByStatusChart';
import CampaignAnalysisSection from './CampaignAnalysisSection';
import ResponsibleAnalysisSection from './ResponsibleAnalysisSection';
import ForecastSection from './ForecastSection';
import TimeFunnelSection from './TimeFunnelSection';
import LeadsTable from './tables/LeadsTable';
import Tabs from './Tabs';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- New Components for Restructure ---

const ActionCenter: React.FC<{ 
    alert: DashboardGeralMetrics['alert'], 
    prospecting: DashboardGeralMetrics['prospecting'],
    followUp: DashboardGeralMetrics['followUp']
}> = ({ alert, prospecting, followUp }) => {
    return (
        <div className="bg-card border border-border rounded-xl p-0 overflow-hidden h-full flex flex-col min-h-[300px]">
            <div className="p-4 border-b border-border bg-slate-800/50">
                <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                    <Icons.AlertTriangle className="text-brand-orange" />
                    Centro de Ação
                </h3>
            </div>
            
            <div className="p-4 space-y-4 flex-grow overflow-y-auto custom-scrollbar">
                {/* 1. Global Alert */}
                {alert && alert.type === 'critical' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-200 font-bold text-sm mb-1">{alert.title}</p>
                        <p className="text-red-300 text-xs">{alert.message}</p>
                        {alert.valueAtRisk && <p className="text-red-100 font-bold text-xs mt-2">{formatCurrency(alert.valueAtRisk)} em risco</p>}
                    </div>
                )}

                {/* 2. Prospecting Risks */}
                {(prospecting.atRisk.notApproached > 0 || prospecting.atRisk.lastAttempt > 0) && (
                     <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div>
                            <p className="text-sm font-semibold text-slate-200">Leads Sem Contato</p>
                            <p className="text-xs text-slate-400">Parados na prospecção</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xl font-bold text-brand-orange">{prospecting.atRisk.total}</p>
                             <p className="text-xs text-brand-orange">Ação Necessária</p>
                        </div>
                     </div>
                )}

                {/* 3. Follow Up Urgency */}
                {(followUp.urgent.lastFup.count > 0 || followUp.urgent.stale7days > 0) && (
                     <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div>
                            <p className="text-sm font-semibold text-slate-200">Follow-Ups Atrasados</p>
                            <p className="text-xs text-slate-400">Leads esfriando</p>
                        </div>
                         <div className="text-right">
                             <p className="text-xl font-bold text-brand-red">{followUp.urgent.stale7days + followUp.urgent.lastFup.count}</p>
                             <p className="text-xs text-brand-red">Urgente</p>
                        </div>
                     </div>
                )}

                {!alert && prospecting.atRisk.total === 0 && followUp.urgent.stale7days === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60 min-h-[150px]">
                        <Icons.CheckCircle className="h-12 w-12 mb-2" />
                        <p>Tudo sob controle!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const CompactKpiCard: React.FC<{title: string, value: string, subtext?: string, color?: string, icon?: React.ReactNode}> = ({ title, value, subtext, color = "text-text-main", icon }) => (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-brand-blue/50 transition-colors h-full">
        <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wide truncate pr-2">{title}</span>
            {icon && <span className="text-text-secondary opacity-70 flex-shrink-0">{icon}</span>}
        </div>
        <div>
            <p className={`text-xl sm:text-2xl font-extrabold ${color} truncate`}>{value}</p>
            {subtext && <p className="text-[10px] sm:text-xs text-text-secondary mt-1 truncate">{subtext}</p>}
        </div>
    </div>
);

// --- Main View ---

interface DashboardGeralViewProps { 
    data: DashboardGeralMetrics; 
    crmData: CrmData[];
}

const DashboardGeralView: React.FC<DashboardGeralViewProps> = ({ data, crmData }) => {
    const [activeTab, setActiveTab] = useState('Visão Geral');
    
    // Deconstruct Data
    const { totalLeadsKpi, newLeadsTodayKpi, activeLeadsKpi, closedSales, geralConversion, velocity } = data;

    // --- Tab 1: Visão Geral (Executive/Operational) ---
    const renderOverview = () => (
        <div className="space-y-6 animate-fade-in-down pb-8">
            {/* ROW 1: The "Z" Top - Diagnosis & Action */}
            {/* Mobile: Stacked, Desktop (XL): Side-by-side 2/3 + 1/3 */}
            <div className="flex flex-col xl:flex-row gap-6 h-auto xl:h-[580px]">
                {/* Priority 1: The Funnel */}
                <div className="w-full xl:w-2/3 h-[500px] xl:h-full">
                     <ChartCard title="Funil de Conversão & Gargalos" loading={false} className="h-full" contentClassName="h-[calc(100%-3rem)] overflow-y-auto no-scrollbar">
                        <VisualFunnel 
                            stages={data.visualFunnel.stages} 
                            conversions={data.visualFunnel.conversions} 
                            bottleneck={data.visualFunnel.bottleneck} 
                            opportunity={data.visualFunnel.opportunity} 
                        />
                     </ChartCard>
                </div>
                
                {/* Priority 2: Action Center */}
                <div className="w-full xl:w-1/3 h-auto xl:h-full">
                    <ActionCenter alert={data.alert} prospecting={data.prospecting} followUp={data.followUp} />
                </div>
            </div>

            {/* ROW 2: Priority 3 - Essential KPIs Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <CompactKpiCard 
                    title="Vendas (Mês)" 
                    value={formatNumber(closedSales.count.current)} 
                    subtext={formatCurrency(closedSales.value.current)} 
                    color="text-brand-green"
                    icon={<Icons.DollarSign className="h-4 w-4 text-brand-green"/>}
                />
                <CompactKpiCard 
                    title="Taxa Conv." 
                    value={formatPercent(geralConversion.rate.current)} 
                    subtext="Global" 
                    color="text-brand-cyan"
                    icon={<Icons.Target className="h-4 w-4 text-brand-cyan"/>}
                />
                 <CompactKpiCard 
                    title="Pipeline" 
                    value={formatCurrency(activeLeadsKpi.value)} 
                    subtext={`${activeLeadsKpi.count} leads`} 
                    color="text-brand-purple"
                    icon={<Icons.Wallet className="h-4 w-4 text-brand-purple"/>}
                />
                 <CompactKpiCard 
                    title="Ticket Médio" 
                    value={formatCurrency(closedSales.avgTicket.current)} 
                    subtext="Vendas" 
                    icon={<Icons.BarChart className="h-4 w-4"/>}
                />
                <CompactKpiCard 
                    title="Novos Leads" 
                    value={formatNumber(totalLeadsKpi.count)} 
                    subtext={`+${newLeadsTodayKpi.count} hoje`} 
                    icon={<Icons.Users className="h-4 w-4"/>}
                />
            </div>

            {/* ROW 3: Secondary Analysis (Forecast & Velocity) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.forecast && <ForecastSection data={data.forecast} />}
                
                <ChartCard title="Ciclo Médio de Vendas" loading={false} className="min-h-[300px]">
                    <div className="flex flex-col sm:flex-row items-center justify-around h-full gap-6 sm:gap-0">
                         <div className="text-center">
                            <p className="text-sm text-text-secondary mb-1">Ciclo Total</p>
                            <p className="text-4xl font-bold text-white">{velocity.avgTotalCycleTime.toFixed(0)} <span className="text-lg text-slate-400">dias</span></p>
                         </div>
                         <div className="h-px w-full sm:h-16 sm:w-px bg-slate-700"></div>
                         <div className="space-y-3 w-full sm:w-auto">
                            <p className="text-xs font-bold text-text-secondary uppercase mb-2 text-center sm:text-left">Por Responsável</p>
                             {velocity.byResponsible.slice(0,3).map(r => (
                                 <div key={r.name} className="flex justify-between items-center gap-4 text-sm bg-slate-800/30 p-2 rounded">
                                     <span className="text-text-secondary truncate max-w-[120px]">{r.name}</span>
                                     <span className="font-mono font-bold">{r.avgDays.toFixed(1)}d</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                </ChartCard>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                {data.timeFunnel && <TimeFunnelSection data={data.timeFunnel} />}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <Tabs 
                tabs={['Visão Geral', 'Campanhas Meta Ads', 'Time & Detalhes']} 
                activeTab={activeTab} 
                onTabClick={setActiveTab} 
            />

            {activeTab === 'Visão Geral' && renderOverview()}
            
            {activeTab === 'Campanhas Meta Ads' && data.campaigns && (
                <div className="animate-fade-in-down pb-8">
                    <CampaignAnalysisSection data={data.campaigns} />
                </div>
            )}

            {activeTab === 'Time & Detalhes' && (
                <div className="space-y-8 animate-fade-in-down pb-8">
                    {data.byResponsible && <ResponsibleAnalysisSection data={data.byResponsible} />}
                    
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-200 uppercase tracking-wider">Base de Leads Detalhada</h2>
                        <LeadsTable data={crmData} loading={false} />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Funil por Status" loading={false} contentClassName="h-64 sm:h-72"><SalesFunnelByStatusChart data={crmData} /></ChartCard>
                        <ChartCard title="Distribuição de Vendas (Semana)" loading={false} contentClassName="h-64 sm:h-72">
                            <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: '#33415540' } }, x: { ticks: { color: '#f8fafc' }, grid: { display: false } } }}} data={{ labels: velocity.salesByDayOfWeek.labels, datasets: [{ label: 'Vendas', data: velocity.salesByDayOfWeek.data, backgroundColor: '#8b5cf6' }]}} />
                        </ChartCard>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardGeralView;
