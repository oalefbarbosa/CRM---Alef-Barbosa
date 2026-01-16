
import React from 'react';
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

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Sub-Components ---
const SmartAlert: React.FC<{ alert: DashboardGeralMetrics['alert'] }> = ({ alert }) => {
    if (!alert) return null;
    const colors = { critical: 'bg-red-900/40 border-red-700 text-red-200', bottleneck: 'bg-orange-900/40 border-orange-700 text-orange-200', opportunity: 'bg-green-900/40 border-green-700 text-green-200' };
    const icons = { critical: <Icons.AlertTriangle/>, bottleneck: <Icons.AlertTriangle/>, opportunity: <Icons.CheckCircle/> }

    return (
        <div className={`rounded-xl p-4 flex items-start gap-4 ${colors[alert.type]}`}>
            <div className="flex-shrink-0 mt-1">{icons[alert.type]}</div>
            <div>
                <h3 className="font-bold">{alert.title}</h3>
                <p className="text-sm opacity-90">{alert.message}</p>
                {alert.valueAtRisk && <p className="font-bold mt-1">{formatCurrency(alert.valueAtRisk)} em risco</p>}
                {alert.details && <div className="text-xs mt-2 space-y-1">{alert.details.map(d => <p key={d}>• {d}</p>)}</div>}
            </div>
        </div>
    );
};

const ProspectingAnalysisSection: React.FC<{ data: DashboardGeralMetrics['prospecting'] }> = ({ data }) => {
    const chartData = { labels: data.distribution.map(a => a.name), datasets: [{ data: data.distribution.map(a => a.count), backgroundColor: '#3b82f6', borderRadius: 4 }]};
    const chartOptions = { indexAxis: 'y' as const, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }, y: { ticks: { color: '#f8fafc', font: {size: 10} }, grid: { display: false } } }};

    return (
        <section>
            <h2 className="text-xl font-bold mb-4 text-slate-200 uppercase tracking-wider flex items-center gap-2">📞 Análise de Prospecção</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ChartCard title={`Distribuição (${data.totalInStage} leads)`} loading={false} contentClassName="h-60"><Bar options={chartOptions} data={chartData} /></ChartCard>
                <ChartCard title="Taxa de Sucesso por Tentativa" loading={false}><p className="text-sm text-center text-text-secondary h-full flex items-center justify-center">Cálculo de eficiência por tentativa requer histórico de eventos.</p></ChartCard>
                <div className="bg-red-900/40 border border-red-700 rounded-xl p-5 flex flex-col justify-center">
                    <h3 className="text-base font-bold text-red-200 mb-2 flex items-center gap-2">🚨 Leads em Risco Imediato</h3>
                    <p className="text-3xl font-bold">{formatNumber(data.atRisk.total)} leads</p>
                    <p className="font-semibold text-red-300 text-lg">{formatCurrency(data.atRisk.value)}</p>
                    <div className="text-sm space-y-1 mt-2 text-red-200">
                        <p>Não abordados: {data.atRisk.notApproached}</p>
                        <p>Última Tentativa: {data.atRisk.lastAttempt}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

const FollowUpAnalysisSection: React.FC<{ data: DashboardGeralMetrics['followUp'] }> = ({ data }) => {
    return (
        <section>
             <h2 className="text-xl font-bold mb-4 text-slate-200 uppercase tracking-wider flex items-center gap-2">✉️ Análise de Follow Up</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ChartCard title={`Distribuição (${data.totalInStage} leads)`} loading={false} contentClassName="h-60">
                    <ul className="space-y-2 h-full flex flex-col justify-center">
                        {data.distribution.map(d => (
                            <li key={d.name} className="flex justify-between text-sm items-center">
                                <span className="text-text-secondary">{d.name}</span>
                                <span className="font-bold bg-slate-700 px-2 py-0.5 rounded">{d.count}</span>
                            </li>
                        ))}
                    </ul>
                </ChartCard>
                <ChartCard title="Performance de Fechamento" loading={false}><p className="text-sm text-center text-text-secondary h-full flex items-center justify-center">Cálculo de fechamento por FUP requer histórico de eventos.</p></ChartCard>
                <div className="bg-orange-900/40 border border-orange-700 rounded-xl p-5 flex flex-col justify-center">
                    <h3 className="text-base font-bold text-orange-200 mb-2 flex items-center gap-2">⏰ Follow Ups Urgentes</h3>
                     <div className="text-sm space-y-2 mt-2 text-orange-200">
                        <p><span className="font-bold">Em Último Fup:</span> {data.urgent.lastFup.count} leads ({formatCurrency(data.urgent.lastFup.value)})</p>
                        <p><span className="font-bold">Sem resposta {'>'}7 dias:</span> {data.urgent.stale7days} leads</p>
                        <p><span className="font-bold">Sem resposta {'>'}14 dias:</span> {data.urgent.stale14days} leads</p>
                    </div>
                </div>
             </div>
        </section>
    )
}

// --- Main View ---

interface DashboardGeralViewProps { 
    data: DashboardGeralMetrics; 
    crmData: CrmData[];
}
const DashboardGeralView: React.FC<DashboardGeralViewProps> = ({ data, crmData }) => {
    const { totalLeadsKpi, newLeadsTodayKpi, activeLeadsKpi, prospeccaoKpi, propostaKpi, followUpKpi, negociacaoKpi, closedSales, lostLeads, geralConversion } = data;
    const conversionRateColor = geralConversion.rate.current >= 5 ? 'text-brand-green' : geralConversion.rate.current >= 2 ? 'text-brand-yellow' : 'text-brand-red';

    const KpiCard: React.FC<{title: string, count: string, value?: string, conversionRate?: number, conversionLabel?: string, icon?: React.ReactNode, children?: React.ReactNode}> = ({ title, count, value, conversionRate, conversionLabel, icon, children }) => (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col h-full"><div className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-2">{icon}<span>{title}</span></div><div className="flex-grow"><p className="text-3xl font-extrabold">{count}</p>{value && <p className="text-lg font-bold text-slate-400">{value}</p>}{children}</div>{conversionRate !== undefined && (<div className="text-xs text-text-secondary mt-2"><span className="font-bold text-brand-cyan">{formatPercent(conversionRate)}</span> {conversionLabel || 'da etapa anterior'}</div>)}</div>
    );

    return (
        <div className="space-y-8">
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <KpiCard title="Total de Leads" count={formatNumber(totalLeadsKpi.count)} value={formatCurrency(totalLeadsKpi.value)} conversionRate={totalLeadsKpi.conversionToNext} conversionLabel="para prospecção"/>
                <KpiCard title="Novos Leads Hoje" count={formatNumber(newLeadsTodayKpi.count)} value={formatCurrency(newLeadsTodayKpi.value)} icon={<Icons.CalendarDays/>} />
                <KpiCard title="Leads Ativos (Pipeline)" count={formatNumber(activeLeadsKpi.count)} value={formatCurrency(activeLeadsKpi.value)} />
                <KpiCard title="Em Prospecção" count={`${formatNumber(prospeccaoKpi.count)} leads`} value={formatCurrency(prospeccaoKpi.value)} conversionRate={prospeccaoKpi.conversion} />
                <KpiCard title="Reunião de Proposta" count={`${formatNumber(propostaKpi.count)} leads`} value={formatCurrency(propostaKpi.value)} conversionRate={propostaKpi.conversion} />
                <KpiCard title="Em Follow up" count={`${formatNumber(followUpKpi.count)} leads`} value={formatCurrency(followUpKpi.value)} conversionRate={followUpKpi.conversion} />
                <KpiCard title="Em Negociação" count={`${formatNumber(negociacaoKpi.count)} leads`} value={formatCurrency(negociacaoKpi.value)} conversionRate={negociacaoKpi.conversion} />
                <div className="bg-card border border-border rounded-xl p-4 flex flex-col h-full"><div className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-2"><Icons.CheckCircle className="text-brand-green" /><span>Vendas Fechadas</span></div><div className="flex-grow"><p className="text-3xl font-extrabold">{formatNumber(closedSales.count.current)} vendas</p><p className="text-lg font-bold text-slate-400">{formatCurrency(closedSales.value.current)}</p>{closedSales.lastSale && <div className="text-xs text-text-secondary mt-1">Última: {closedSales.lastSale.daysAgo.toFixed(0)}d atrás ({formatCurrency(closedSales.lastSale.value)})</div>}</div><div className="text-xs text-text-secondary mt-2"><span className="font-bold text-brand-cyan">{formatPercent(closedSales.conversion)}</span> da etapa anterior</div></div>
                <KpiCard title="Leads Perdidos" count={`${formatNumber(lostLeads.count.current)} leads`} value={formatCurrency(lostLeads.value)} icon={<Icons.XCircle className="text-brand-red"/>}><div className="text-xs text-text-secondary mt-1">{lostLeads.topReasons.map(r => <p key={r.reason}>• {r.reason}: {r.count}</p>)}</div></KpiCard>
                <KpiCard title="Taxa de Conversão Global" count={formatPercent(geralConversion.rate.current)} icon={<Icons.Target className={conversionRateColor}/>}><p className="text-xs text-text-secondary">{geralConversion.sales} vendas de {geralConversion.totalLeads} leads</p></KpiCard>
            </section>
            
            <SmartAlert alert={data.alert} />

            <ProspectingAnalysisSection data={data.prospecting} />
            <FollowUpAnalysisSection data={data.followUp} />
            {data.campaigns && <CampaignAnalysisSection data={data.campaigns} />}
            {data.byResponsible && <ResponsibleAnalysisSection data={data.byResponsible} />}
            {data.forecast && <ForecastSection data={data.forecast} />}

            <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <ChartCard title="Funil de Conversão Detalhado" loading={false} className="lg:col-span-3" contentClassName="p-2">
                    <VisualFunnel stages={data.visualFunnel.stages} conversions={data.visualFunnel.conversions} bottleneck={data.visualFunnel.bottleneck} opportunity={data.visualFunnel.opportunity} />
                </ChartCard>
                <div className="lg:col-span-2 space-y-6">
                    {data.timeFunnel && <TimeFunnelSection data={data.timeFunnel} />}
                    <ChartCard title="⏱️ Velocidade do Funil (Real)" loading={false}>
                        <div className="text-center"><p className="text-sm text-text-secondary">Ciclo Total Médio</p><p className="text-3xl font-bold">{data.velocity.avgTotalCycleTime.toFixed(1)} dias</p></div>
                        <div className="mt-4 pt-4 border-t border-border"><h4 className="font-semibold text-text-secondary text-sm mb-2">Velocidade por Responsável</h4><ul className="text-sm space-y-1">{data.velocity.byResponsible.map(r => <li key={r.name} className="flex justify-between"><span>• {r.name}:</span><span className="font-bold">{r.avgDays.toFixed(1)} dias</span></li>)}</ul></div>
                    </ChartCard>
                </div>
            </section>
             <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Funil de Vendas por Status" loading={false}><SalesFunnelByStatusChart data={crmData} /></ChartCard>
                <ChartCard title="📅 Distribuição de Fechamentos" loading={false}><Bar options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#94a3b8' }, grid: { color: '#33415540' } }, x: { ticks: { color: '#f8fafc' }, grid: { display: false } } }}} data={{ labels: data.velocity.salesByDayOfWeek.labels, datasets: [{ label: 'Vendas', data: data.velocity.salesByDayOfWeek.data, backgroundColor: '#8b5cf6' }]}} /></ChartCard>
            </section>
        </div>
    );
};

export default DashboardGeralView;