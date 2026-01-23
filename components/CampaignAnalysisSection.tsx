
import React, { useMemo, useState } from 'react';
import { CampaignAnalysis, CampaignPerformanceData } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import * as Icons from './Icons';
import ChartCard from './ChartCard';
import { useChart } from './charts/BaseChart';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, BubbleController, LineElement, TimeScale } from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, BubbleController, LineElement, TimeScale);

const CampaignSummaryCard: React.FC<{title: string, value: string, change?: number, changeIsPositiveGood?: boolean, subValue?:string, footer: string, icon: React.ReactNode, children?: React.ReactNode}> = ({title, value, change, changeIsPositiveGood, subValue, footer, icon, children}) => {
    const isPositive = change !== undefined && change >= 0;
    let changeColor = 'text-text-secondary';
    if(change !== undefined && isFinite(change) && change !== 0) {
        changeColor = (isPositive === changeIsPositiveGood) ? 'text-brand-green' : 'text-brand-red';
    }
    const ChangeIcon = (change !== undefined && isFinite(change)) ? (isPositive ? Icons.ArrowUpRight : Icons.ArrowDownRight) : null;

    return (
        <div className="bg-card border-border border rounded-xl p-5 flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-center text-text-secondary mb-1">
                    <span className="text-sm font-semibold truncate">{title}</span>
                    <span className="flex-shrink-0 ml-2">{icon}</span>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-text-main truncate">{value}</p>
                 {subValue && <p className="text-xs sm:text-sm text-text-secondary truncate">{subValue}</p>}
                 {children}
            </div>
            <div className="flex justify-between items-baseline text-xs mt-3 pt-2 border-t border-border/30">
                <p className="text-text-secondary truncate pr-2">{footer}</p>
                 {ChangeIcon && (
                    <div className={`flex items-center font-bold ${changeColor} whitespace-nowrap`}>
                        <ChangeIcon className="h-3 w-3 sm:h-4 sm:w-4"/>
                        <span>{isFinite(change!) ? `${change!.toFixed(0)}%` : 'Novo'}</span>
                    </div>
                 )}
            </div>
        </div>
    );
}

const PerformanceByCampaignChart: React.FC<{data: CampaignPerformanceData[]}> = ({data}) => {
    const configFactory = React.useCallback((): ChartConfiguration => {
        const chartData: ChartData = {
            labels: data.map(c => c.name.substring(0,15) + (c.name.length > 15 ? '...' : '')),
            datasets: [
                { label: 'Investimento (R$)', data: data.map(c => c.investment), backgroundColor: '#3b82f6', yAxisID: 'y' },
                { label: 'Leads Gerados', data: data.map(c => c.leads), backgroundColor: '#22c55e', yAxisID: 'y1' },
                { label: 'Vendas Geradas', data: data.map(c => c.sales), backgroundColor: '#f59e0b', yAxisID: 'y1' }
            ]
        };
        return {
            type: 'bar', data: chartData,
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 10, font: {size: 10} } }, tooltip: { mode: 'index' } },
                scales: {
                    x: { display: false },
                    y: { grid: { color: '#33415520' }, ticks: { color: '#f8fafc', font: { size: 10 }, autoSkip: false } },
                    y1: { display: false }
                }
            }
        };
    }, [data]);
    const canvasRef = useChart(configFactory, data);
    return <canvas ref={canvasRef} />
};

const RoiBubbleChart: React.FC<{data: CampaignAnalysis['roiBubbleData']}> = ({data}) => {
     const configFactory = React.useCallback((): ChartConfiguration => {
        const chartData: ChartData = {
            datasets: [{
                label: 'Campanhas',
                data: data,
                backgroundColor: data.map(d => d.roi > 100 ? '#22c55e90' : d.roi > 0 ? '#facc1590' : '#ef444490'),
                borderColor: data.map(d => d.roi > 100 ? '#22c55e' : d.roi > 0 ? '#facc15' : '#ef4444'),
                borderWidth: 2,
            }]
        };
        return {
            type: 'bubble', data: chartData,
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context: any) => {
                                const d = context.raw;
                                return `${d.name}: ROI ${formatPercent(d.roi)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'CPL (R$)', color: '#94a3b8', font: {size: 10} }, grid: { color: '#334155' }, ticks: { color: '#94a3b8', callback: v => formatCurrency(v as number), font: {size: 10}} },
                    y: { title: { display: true, text: 'Conv. %', color: '#94a3b8', font: {size: 10} }, grid: { color: '#334155' }, ticks: { color: '#94a3b8', callback: v => formatPercent(v as number), font: {size: 10} } }
                }
            }
        }
     }, [data]);
     const canvasRef = useChart(configFactory, data);
     return <canvas ref={canvasRef} />
};

const CampaignsTable: React.FC<{data: CampaignPerformanceData[]}> = ({ data }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{key: keyof CampaignPerformanceData, direction: 'asc' | 'desc'}>({key: 'investment', direction: 'desc'});
    
    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        if (searchTerm) sortableItems = sortableItems.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        sortableItems.sort((a, b) => {
            const valA = a[sortConfig.key] || 0;
            const valB = b[sortConfig.key] || 0;
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [data, searchTerm, sortConfig]);

    const requestSort = (key: keyof CampaignPerformanceData) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    };

    const getSortIndicator = (key: keyof CampaignPerformanceData) => sortConfig.key !== key ? '↕' : (sortConfig.direction === 'desc' ? '↓' : '↑');
    const getRowColor = (roi: number) => roi > 200 ? 'bg-green-500/10 hover:bg-green-500/20' : roi > 0 ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : 'bg-red-500/10 hover:bg-red-500/20';

    const headers: {key: keyof CampaignPerformanceData, label: string, isNum: boolean, minWidth?: string}[] = [
        {key: 'name', label: 'Campanha', isNum: false, minWidth: 'min-w-[150px]'}, 
        {key: 'investment', label: 'Invest.', isNum: true}, 
        {key: 'leads', label: 'Leads', isNum: true}, 
        {key: 'cpl', label: 'CPL', isNum: true},
        {key: 'sales', label: 'Vendas', isNum: true}, 
        {key: 'wonValue', label: 'Valor', isNum: true}, 
        {key: 'roi', label: 'ROI', isNum: true}, 
        {key: 'avgTimeToSale', label: 'Tempo', isNum: true, minWidth: 'min-w-[80px]'}, 
        {key: 'topResponsible', label: 'Resp.', isNum: false}
    ];

    return (
        <div className="bg-card border-border border rounded-xl p-4">
            <input type="text" placeholder="Buscar campanha..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:max-w-xs bg-background border border-border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-blue text-sm" />
            <div className="overflow-x-auto custom-scrollbar pb-2">
                <table className="w-full text-sm min-w-[800px]">
                    <thead className="text-left text-xs text-text-secondary uppercase">
                        <tr>{headers.map(h => <th key={h.key} className={`p-2 cursor-pointer ${h.isNum ? 'text-right' : ''} ${h.minWidth || ''}`} onClick={() => requestSort(h.key)}>{h.label} <span className="text-gray-500">{getSortIndicator(h.key)}</span></th>)}</tr>
                    </thead>
                    <tbody>
                        {sortedData.map(c => ( <tr key={c.name} className={`border-t border-border ${getRowColor(c.roi)}`}>
                            <td className="p-2 font-semibold truncate max-w-[200px]" title={c.name}>{c.name}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(c.investment)}</td>
                            <td className="p-2 text-right font-mono">{formatNumber(c.leads)}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(c.cpl)}</td>
                            <td className="p-2 text-right font-mono">{c.sales.toFixed(1)}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(c.wonValue)}</td>
                            <td className="p-2 text-right font-mono font-bold">{isFinite(c.roi) ? formatPercent(c.roi) : '∞'}</td>
                            <td className="p-2 text-right font-mono">{c.avgTimeToSale ? `${c.avgTimeToSale.toFixed(1)}d` : 'N/A'}</td>
                            <td className="p-2 truncate max-w-[100px]">{c.topResponsible || 'N/A'}</td>
                        </tr>))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const CampaignAnalysisSection: React.FC<{ data: CampaignAnalysis }> = ({ data }) => {
    const { investment, leads, cpl, roi, salesCount, wonValue, bestCampaign, cac, ltvCacRatio, leadToSaleConversion, metaAdsLeadsCount, avgTimeToSale } = data;
    return (
        <section className="space-y-8">
            <h2 className="text-xl font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">📊 Análise de Campanhas Meta Ads</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <CampaignSummaryCard title="Investimento" value={formatCurrency(investment.current)} change={investment.change} changeIsPositiveGood={false} footer={`Em ${data.detailedCampaigns.length} campanhas`} icon={<Icons.DollarSign className="h-5 w-5"/>}/>
                <CampaignSummaryCard title="Leads Gerados" value={formatNumber(leads.current)} subValue={`CPL: ${formatCurrency(cpl.current)}`} change={leads.change} changeIsPositiveGood={true} footer="Das campanhas" icon={<Icons.Users className="h-5 w-5"/>}/>
                <CampaignSummaryCard title="CPL Médio" value={formatCurrency(cpl.current)} change={cpl.change} changeIsPositiveGood={false} footer="Meta: R$ 5,00" icon={<Icons.BarChart className="h-5 w-5"/>}/>
                <CampaignSummaryCard title="ROI de Vendas" value={isFinite(roi) ? formatPercent(roi) : '∞'} subValue={`Vendas: ${formatCurrency(wonValue)}`} footer={`${salesCount.toFixed(1)} vendas fechadas`} icon={<Icons.Target className="h-5 w-5"/>}>
                    <p className="text-[10px] text-text-secondary mt-1">Ciclo médio: {avgTimeToSale.toFixed(1)} dias</p>
                </CampaignSummaryCard>
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Performance (Top 5 Investimento)" loading={false} contentClassName="h-80"><PerformanceByCampaignChart data={data.topCampaignsByInvestment}/></ChartCard>
                <ChartCard title="Matriz ROI x Conversão" loading={false} contentClassName="h-80"><RoiBubbleChart data={data.roiBubbleData}/></ChartCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border-border border rounded-xl p-5 text-center flex flex-col items-center justify-center min-h-[160px]"><h4 className="text-xs font-bold text-text-secondary mb-2 uppercase">Melhor Campanha (ROI)</h4><p className="font-bold text-brand-yellow text-lg truncate w-full px-2" title={bestCampaign?.name}>{bestCampaign?.name || 'N/A'}</p><p className="text-3xl font-extrabold my-2 text-white">{isFinite(bestCampaign?.roi ?? 0) ? formatPercent(bestCampaign?.roi ?? 0) : '∞'} ROI</p><p className="text-xs text-text-secondary">{formatCurrency(bestCampaign?.investment ?? 0)} → {formatCurrency(bestCampaign?.wonValue ?? 0)}</p></div>
                 <div className="bg-card border-border border rounded-xl p-5 text-center flex flex-col items-center justify-center min-h-[160px]"><h4 className="text-xs font-bold text-text-secondary mb-2 uppercase">Custo Por Aquisição (CAC)</h4><p className="text-3xl font-extrabold my-2 text-white">{formatCurrency(cac)}</p><p className="text-xs text-text-secondary">LTV/CAC Ratio: <span className={ltvCacRatio > 3 ? 'text-green-400 font-bold' : 'text-text-main'}>{ltvCacRatio.toFixed(2)}x</span></p></div>
                 <div className="bg-card border-border border rounded-xl p-5 text-center flex flex-col items-center justify-center min-h-[160px]"><h4 className="text-xs font-bold text-text-secondary mb-2 uppercase">Conversão Lead → Venda</h4><p className="text-3xl font-extrabold my-2 text-white">{formatPercent(leadToSaleConversion.current)}</p><p className="text-xs text-text-secondary">{salesCount.toFixed(1)} vendas de {formatNumber(metaAdsLeadsCount)} leads</p></div>
            </div>

            <CampaignsTable data={data.detailedCampaigns} />
        </section>
    );
};

export default CampaignAnalysisSection;
