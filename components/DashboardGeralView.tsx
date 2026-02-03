import React, { useState } from 'react';
import { CrmData, DashboardGeralMetrics } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import * as Icons from './Icons';
import VisualFunnel from './VisualFunnel';
import ChartCard from './ChartCard';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import SalesFunnelByStatusChart from './charts/SalesFunnelByStatusChart';
import CampaignAnalysisSection from './CampaignAnalysisSection';
import ResponsibleAnalysisSection from './ResponsibleAnalysisSection';
import ForecastSection from './ForecastSection';
import TimeFunnelSection from './TimeFunnelSection';
import LeadsTable from './tables/LeadsTable';
import Tabs from './Tabs';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

// --- New Components for Restructure ---

const ActionCenter: React.FC<{ 
    alert: DashboardGeralMetrics['alert'], 
    prospecting: DashboardGeralMetrics['prospecting'],
    followUp: DashboardGeralMetrics['followUp'],
    velocity: DashboardGeralMetrics['velocity']
}> = ({ alert, prospecting, followUp, velocity }) => {
    return (
        <div className="bg-card border border-border rounded-xl p-0 overflow-hidden h-full flex flex-col min-h-[300px]">
            <div className="p-4 border-b border-border bg-bg-subtle/50">
                <h3 className="font-bold text-lg flex items-center gap-2 text-text-main">
                    <Icons.AlertTriangle className="text-brand-orange" />
                    Centro de Ação
                </h3>
            </div>
            
            <div className="p-4 space-y-4 flex-grow overflow-y-auto custom-scrollbar">
                {/* 1. Global Alert */}
                {alert && alert.type === 'critical' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-500 font-bold text-sm mb-1">{alert.title}</p>
                        <p className="text-red-400 text-xs">{alert.message}</p>
                        {alert.valueAtRisk && <p className="text-red-500 font-bold text-xs mt-2">{formatCurrency(alert.valueAtRisk)} em risco</p>}
                    </div>
                )}

                {/* 2. Prospecting Risks */}
                {(prospecting.atRisk.notApproached > 0 || prospecting.atRisk.lastAttempt > 0) && (
                     <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-bg-subtle/30">
                        <div>
                            <p className="text-sm font-semibold text-text-main">Leads Sem Contato</p>
                            <p className="text-xs text-text-secondary">Parados na prospecção</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xl font-bold text-brand-orange">{prospecting.atRisk.total}</p>
                             <p className="text-xs text-brand-orange">Ação Necessária</p>
                        </div>
                     </div>
                )}

                {/* 3. Follow Up Urgency */}
                {(followUp.urgent.lastFup.count > 0 || followUp.urgent.stale7days > 0) && (
                     <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-bg-subtle/30">
                        <div>
                            <p className="text-sm font-semibold text-text-main">Follow-Ups Atrasados</p>
                            <p className="text-xs text-text-secondary">Leads esfriando</p>
                        </div>
                         <div className="text-right">
                             <p className="text-xl font-bold text-brand-red">{followUp.urgent.stale7days + followUp.urgent.lastFup.count}</p>
                             <p className="text-xs text-brand-red">Urgente</p>
                        </div>
                     </div>
                )}
                
                {/* 4. Aging (New) */}
                {(velocity.staleLeads['14_days'] > 0 || velocity.staleLeads['30_days'] > 0) && (
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-bg-subtle/30">
                        <div>
                            <p className="text-sm font-semibold text-text-main">Leads Envelhecendo</p>
                            <p className="text-xs text-text-secondary">Sem atualização há +14 dias</p>
                        </div>
                        <div className="text-right">
                             <p className="text-xl font-bold text-brand-red">{velocity.staleLeads['14_days'] + velocity.staleLeads['30_days']}</p>
                             <p className="text-xs text-brand-red">Crítico</p>
                        </div>
                     </div>
                )}

                {!alert && prospecting.atRisk.total === 0 && followUp.urgent.stale7days === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-60 min-h-[150px]">
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

// --- New Sections ---

const AcquisitionSection: React.FC<{ data: DashboardGeralMetrics['acquisitionAnalysis'], newLeads: any }> = ({ data, newLeads }) => {
    const sourceData = {
        labels: data.sources.slice(0, 5).map(s => s.label),
        datasets: [
            { label: 'Leads', data: data.sources.slice(0, 5).map(s => s.total), backgroundColor: '#3b82f6' },
            { label: 'Pipeline (R$)', data: data.sources.slice(0, 5).map(s => s.pipeline), backgroundColor: '#22c55e', hidden: true }
        ]
    };
    
    const evolutionData = {
        labels: data.evolution.labels,
        datasets: [{ label: 'Novos Leads', data: data.evolution.count, borderColor: '#22d3d8', backgroundColor: 'rgba(34, 211, 216, 0.1)', fill: true, tension: 0.3 }]
    };

    return (
        <section className="space-y-4">
            <h3 className="text-lg font-bold text-text-main uppercase tracking-wide flex items-center gap-2"><Icons.Users className="w-5 h-5 text-brand-blue"/> Aquisição</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Origem dos Leads (Top 5)" loading={false} contentClassName="h-64">
                    <Bar data={sourceData} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, y: { grid: { display: false }, ticks: { color: '#94a3b8' } } }}} />
                </ChartCard>
                <ChartCard title="Evolução de Entrada (8 Semanas)" loading={false} contentClassName="h-64">
                    <Line data={evolutionData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8' } }, y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } } }}} />
                </ChartCard>
            </div>
        </section>
    );
};

const QualitySection: React.FC<{ data: DashboardGeralMetrics['qualityAnalysis'] }> = ({ data }) => {
    // Helpers for validation indicators
    const tempValid = data.temperature.length >= 2 ? data.temperature[0].rate >= data.temperature[data.temperature.length-1].rate : true;
    
    return (
        <section className="space-y-4">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-text-main uppercase tracking-wide flex items-center gap-2"><Icons.Target className="w-5 h-5 text-brand-purple"/> Qualidade & Qualificação</h3>
                {!tempValid && <span className="text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full font-bold">⚠️ Revisar critérios de Temp.</span>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Temperature */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <h4 className="text-sm font-bold text-text-secondary mb-3">Conversão por Temperatura</h4>
                    <div className="space-y-3">
                        {data.temperature.map(t => (
                            <div key={t.label} className="flex justify-between items-center text-sm">
                                <span className="font-semibold w-16">{t.label}</span>
                                <div className="flex-1 mx-2 bg-slate-700 h-2 rounded-full overflow-hidden">
                                    <div className="bg-brand-purple h-full" style={{width: `${t.rate}%`}}></div>
                                </div>
                                <span className="font-mono text-brand-purple font-bold">{t.rate.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ABC */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <h4 className="text-sm font-bold text-text-secondary mb-3">Perfil ABC (Ticket Médio)</h4>
                    <div className="space-y-3">
                        {data.abc.map(t => (
                            <div key={t.label} className="flex justify-between items-center text-sm border-b border-border/50 pb-1 last:border-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold bg-bg-subtle px-2 rounded">{t.label}</span>
                                    <span className="text-text-secondary text-xs">({t.total} leads)</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-brand-green">{formatCurrency(t.avgTicket)}</p>
                                    <p className="text-xs text-text-secondary">{t.rate.toFixed(1)}% conv.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Services */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <h4 className="text-sm font-bold text-text-secondary mb-3">Performance por Serviço</h4>
                    <div className="space-y-2 overflow-y-auto max-h-[150px] custom-scrollbar">
                        {data.services.map(s => (
                            <div key={s.label} className="flex justify-between items-center text-xs p-2 bg-bg-subtle/30 rounded">
                                <span className="truncate max-w-[100px]" title={s.label}>{s.label}</span>
                                <div className="flex gap-3">
                                    <span className="font-bold">{s.total} leads</span>
                                    <span className="text-brand-cyan">{s.rate.toFixed(0)}% conv</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const ContractsSection: React.FC<{ data: DashboardGeralMetrics['contractsAnalysis'] }> = ({ data }) => {
    return (
        <section className="space-y-4">
            <h3 className="text-lg font-bold text-text-main uppercase tracking-wide flex items-center gap-2"><Icons.FileText className="w-5 h-5 text-brand-green"/> Contratos & LTV</h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Future Revenue KPI */}
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-xs text-text-secondary uppercase font-bold">Receita Garantida (3 meses)</p>
                    <p className="text-2xl font-extrabold text-brand-green mt-1">{formatCurrency(data.futureRevenue.next3Months)}</p>
                    <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
                        <Icons.AlertTriangle className="w-3 h-3 text-brand-yellow"/>
                        {data.futureRevenue.expiring90Days} vencendo em 90d
                    </p>
                </div>

                {/* LTV KPI */}
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center">
                    <p className="text-xs text-text-secondary uppercase font-bold">LTV Médio Projetado</p>
                    <p className="text-2xl font-extrabold text-brand-blue mt-1">{formatCurrency(data.ltv.average)}</p>
                    <p className="text-xs text-text-secondary mt-2">Total projetado: {formatNumber(data.ltv.totalProjected)}</p>
                </div>

                {/* Duration Chart */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
                    <h4 className="text-sm font-bold text-text-secondary mb-2">Duração de Contratos (Vendas)</h4>
                    <div className="flex gap-2 h-20 items-end">
                        {data.duration.map(d => (
                            <div key={d.label} className="flex-1 flex flex-col justify-end group relative">
                                <div className="bg-brand-green/20 hover:bg-brand-green/40 transition-colors rounded-t w-full relative group-hover:shadow-lg" style={{height: `${Math.max(20, d.percentage)}%`}}>
                                    <span className="absolute bottom-1 w-full text-center text-xs font-bold">{d.count}</span>
                                </div>
                                <p className="text-[10px] text-center mt-1 truncate text-text-secondary">{d.label}</p>
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs p-2 rounded hidden group-hover:block z-10 whitespace-nowrap">
                                    {formatCurrency(d.value)} ({d.percentage.toFixed(0)}%)
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const LossAnalysisSection: React.FC<{ data: DashboardGeralMetrics['lossAnalysis'] }> = ({ data }) => {
    const reasonData = {
        labels: data.reasons.slice(0, 5).map(r => r.reason),
        datasets: [{ label: 'Leads', data: data.reasons.slice(0, 5).map(r => r.count), backgroundColor: '#ef4444' }]
    };

    return (
        <section className="space-y-4">
            <h3 className="text-lg font-bold text-text-main uppercase tracking-wide flex items-center gap-2"><Icons.TrendingDown className="w-5 h-5 text-brand-red"/> Análise de Perdas</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Principais Motivos de Perda" loading={false} contentClassName="h-64">
                    <Bar data={reasonData} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, y: { grid: { display: false }, ticks: { color: '#94a3b8' } } }}} />
                </ChartCard>
                
                <div className="bg-card border border-border rounded-xl p-6">
                    <h4 className="text-lg font-bold text-text-main mb-4">Esforço até o Resultado</h4>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-3 bg-green-500/10 rounded-lg">
                            <p className="text-xs text-text-secondary uppercase">Média Tentativas (Ganho)</p>
                            <p className="text-2xl font-bold text-brand-green">{data.attemptsToWin.toFixed(1)}</p>
                        </div>
                        <div className="text-center p-3 bg-red-500/10 rounded-lg">
                            <p className="text-xs text-text-secondary uppercase">Média Tentativas (Perda)</p>
                            <p className="text-2xl font-bold text-brand-red">{data.attemptsToLose.toFixed(1)}</p>
                        </div>
                    </div>
                    {data.attemptsToLose < 2 && (
                        <div className="flex items-start gap-2 text-brand-orange text-xs bg-orange-500/10 p-3 rounded">
                            <Icons.AlertTriangle className="w-4 h-4 flex-shrink-0"/>
                            <p>Alerta: Leads estão sendo perdidos com poucas tentativas. Considere aumentar a persistência do time.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

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
        <div className="space-y-8 animate-fade-in-down pb-8">
            {/* ROW 1: Essential KPIs Strip */}
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

            {/* ROW 2: The "Z" Top - Diagnosis & Action */}
            <div className="flex flex-col xl:flex-row gap-6 h-auto xl:h-[500px]">
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
                <div className="w-full xl:w-1/3 h-auto xl:h-full">
                    <ActionCenter alert={data.alert} prospecting={data.prospecting} followUp={data.followUp} velocity={data.velocity} />
                </div>
            </div>

            {/* SECTION: Acquisition */}
            <AcquisitionSection data={data.acquisitionAnalysis} newLeads={totalLeadsKpi} />

            {/* SECTION: Quality */}
            <QualitySection data={data.qualityAnalysis} />

            {/* ROW: Forecast & Cycle */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.forecast && <ForecastSection data={data.forecast} />}
                <ChartCard title="Ciclo Médio de Vendas" loading={false} className="min-h-[300px]">
                    <div className="flex flex-col sm:flex-row items-center justify-around h-full gap-6 sm:gap-0">
                         <div className="text-center">
                            <p className="text-sm text-text-secondary mb-1">Ciclo Total</p>
                            <p className="text-4xl font-bold text-text-main">{velocity.avgTotalCycleTime.toFixed(0)} <span className="text-lg text-text-secondary">dias</span></p>
                         </div>
                         <div className="h-px w-full sm:h-16 sm:w-px bg-border"></div>
                         <div className="space-y-3 w-full sm:w-auto">
                            <p className="text-xs font-bold text-text-secondary uppercase mb-2 text-center sm:text-left">Por Responsável</p>
                             {velocity.byResponsible.slice(0,3).map(r => (
                                 <div key={r.name} className="flex justify-between items-center gap-4 text-sm bg-bg-subtle/50 p-2 rounded border border-border/50">
                                     <span className="text-text-secondary truncate max-w-[120px]">{r.name}</span>
                                     <span className="font-mono font-bold text-text-main">{r.avgDays.toFixed(1)}d</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                </ChartCard>
            </div>

            {/* SECTION: Contracts & LTV */}
            <ContractsSection data={data.contractsAnalysis} />

            {/* SECTION: Loss Analysis */}
            <LossAnalysisSection data={data.lossAnalysis} />
            
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
                        <h2 className="text-xl font-bold text-text-main uppercase tracking-wider">Base de Leads Detalhada</h2>
                        <LeadsTable data={crmData} loading={false} />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Funil por Status" loading={false} contentClassName="h-64 sm:h-72"><SalesFunnelByStatusChart data={crmData} /></ChartCard>
                        <ChartCard title="Distribuição de Vendas (Semana)" loading={false} contentClassName="h-64 sm:h-72">
                            <Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: '#33415540' } }, x: { ticks: { color: '#64748b' }, grid: { display: false } } }}} data={{ labels: velocity.salesByDayOfWeek.labels, datasets: [{ label: 'Vendas', data: velocity.salesByDayOfWeek.data, backgroundColor: '#8b5cf6' }]}} />
                        </ChartCard>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardGeralView;