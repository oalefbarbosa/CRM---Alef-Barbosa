import { CrmData, CampaignData, DashboardGeralMetrics, FunnelConversion, FunnelStage, Alert, CampaignPerformanceData, CampaignAnalysis, ResponsibleAnalysis, ForecastAnalysis, TimeFunnelAnalysis, ResponsibleData, FunnelVelocity } from '../types';

const FUNNEL_STAGES_ORDER = [ 'leads', 'em prospecção', 'reunião de triagem', 'reunião de proposta', 'em follow up', 'em negociação', 'ganho' ];
const ACTIVE_PIPELINE_STAGES = ['em prospecção', 'reunião de triagem', 'reunião de proposta', 'em follow up', 'em negociação'];
const TIME_FUNNEL_STAGES_ORDER = ['em prospecção', 'reunião de triagem', 'reunião de proposta', 'em follow up', 'em negociação'];

const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? Infinity : 0;
    return ((current - previous) / previous) * 100;
};

const diffInDays = (date1: Date, date2: Date): number => {
    if(!date1 || !date2) return 0;
    return (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
}

const SUGGESTIONS: {[key: string]: string} = {
  'leads_em prospecção': 'O time de prospecção precisa de mais agilidade para o primeiro contato.',
  'em prospecção_reunião de triagem': 'Revisar script de qualificação e aumentar taxa de agendamento.',
  'reunião de triagem_reunião de proposta': 'Melhorar critérios de qualificação do SDR para garantir que apenas leads com fit avancem.',
  'reunião de proposta_em follow up': 'Ajustar apresentação comercial, que pode não estar gerando valor suficiente.',
  'em follow up_em negociação': 'Reduzir tempo entre follow ups e usar gatilhos de urgência.',
  'em negociação_ganho': 'Revisar objeções comuns e oferecer mais opções de pagamento ou flexibilidade.'
};

// Main calculation function
export const calculateDashboardGeralMetrics = (
    currentCrmData: CrmData[],
    allCrmData: CrmData[],
    currentCampaignData: CampaignData[],
    allCampaignData: CampaignData[],
    dateRange: { startDate: Date | null, endDate: Date | null }
): DashboardGeralMetrics | null => {
    if (currentCrmData.length === 0 && allCrmData.length === 0) return null;

    let previousPeriodCrmData: CrmData[] = [];
    if (dateRange.startDate && dateRange.endDate) {
        const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
        const prevEnd = new Date(dateRange.startDate.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);
        previousPeriodCrmData = allCrmData.filter(d => d.dataCriacao >= prevStart && d.dataCriacao <= prevEnd);
    }
    
    // --- CORRECTED SALES LOGIC ---
    // Sales KPIs are now based on leads CLOSED within the date range, regardless of creation date.
    const wonLeadsCurrent = allCrmData.filter(l => {
        if (l.status !== 'ganho' || !l.dataFechamento) return false;
        if (dateRange.startDate && dateRange.endDate) {
            const inclusiveEndDate = new Date(dateRange.endDate);
            inclusiveEndDate.setHours(23, 59, 59, 999);
            return l.dataFechamento >= dateRange.startDate && l.dataFechamento <= inclusiveEndDate;
        }
        return true;
    });

    let wonLeadsPrev: CrmData[] = [];
    if (dateRange.startDate && dateRange.endDate) {
        const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
        const prevEnd = new Date(dateRange.startDate.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - duration);
        wonLeadsPrev = allCrmData.filter(l => {
            if (l.status !== 'ganho' || !l.dataFechamento) return false;
            return l.dataFechamento >= prevStart && l.dataFechamento <= prevEnd;
        });
    }
    
    const wonLeadsWithDateCurrent = wonLeadsCurrent.filter(l => l.dataFechamento);

    // --- 1. Top KPIs ---
    // Lead-based KPIs still use `currentCrmData` (leads CREATED in period).
    const activePipelineLeads = currentCrmData.filter(l => ACTIVE_PIPELINE_STAGES.includes(l.status));
    const lostLeadsInCreatedCohort = currentCrmData.filter(l => l.status === 'perdido');
    const prevLostLeadsInCreatedCohort = previousPeriodCrmData.filter(l => l.status === 'perdido');

    // Global Conversion Rate is based on the cohort of leads CREATED in the period.
    const wonLeadsFromCreatedCohort = currentCrmData.filter(l => l.status === 'ganho');
    const wonLeadsFromCreatedCohortPrev = previousPeriodCrmData.filter(l => l.status === 'ganho');
    const geralConversion = {
        rate: {
            current: currentCrmData.length > 0 ? (wonLeadsFromCreatedCohort.length / currentCrmData.length) * 100 : 0,
            previous: previousPeriodCrmData.length > 0 ? (wonLeadsFromCreatedCohortPrev.length / previousPeriodCrmData.length) * 100 : 0,
            change: 0, diff: 0
        },
        sales: wonLeadsFromCreatedCohort.length, totalLeads: currentCrmData.length,
    };
    geralConversion.rate.diff = geralConversion.rate.current - geralConversion.rate.previous;
    geralConversion.rate.change = calculateChange(geralConversion.rate.current, geralConversion.rate.previous);

    const lastSale = wonLeadsWithDateCurrent.length > 0
        ? [...wonLeadsWithDateCurrent].sort((a,b) => b.dataFechamento!.getTime() - a.dataFechamento!.getTime())[0]
        : null;

    // Sales KPIs now use the correctly filtered `wonLeadsCurrent` and `wonLeadsPrev` arrays.
    const closedSales = {
        count: { current: wonLeadsCurrent.length, previous: wonLeadsPrev.length, change: wonLeadsCurrent.length - wonLeadsPrev.length },
        value: { current: wonLeadsCurrent.reduce((s, l) => s + l.valor, 0), previous: wonLeadsPrev.reduce((s, l) => s + l.valor, 0), change: 0 },
        avgTicket: { current: wonLeadsCurrent.length > 0 ? wonLeadsCurrent.reduce((s, l) => s + l.valor, 0) / wonLeadsCurrent.length : 0, previous: 0, change: 0 },
        conversion: 0, // Will be filled later
        lastSale: lastSale ? { daysAgo: diffInDays(new Date(), lastSale.dataFechamento!), value: lastSale.valor } : null
    };
    closedSales.value.change = calculateChange(closedSales.value.current, closedSales.value.previous);
    closedSales.avgTicket.previous = wonLeadsPrev.length > 0 ? wonLeadsPrev.reduce((s, l) => s + l.valor, 0) / wonLeadsPrev.length : 0;
    closedSales.avgTicket.change = calculateChange(closedSales.avgTicket.current, closedSales.avgTicket.previous);

    const lostLeadsData = {
        count: { current: lostLeadsInCreatedCohort.length, previous: prevLostLeadsInCreatedCohort.length, change: lostLeadsInCreatedCohort.length - prevLostLeadsInCreatedCohort.length },
        value: lostLeadsInCreatedCohort.reduce((s, l) => s + l.valor, 0),
        avgValue: lostLeadsInCreatedCohort.length > 0 ? lostLeadsInCreatedCohort.reduce((s, l) => s + l.valor, 0) / lostLeadsInCreatedCohort.length : 0,
        topReasons: Object.entries(lostLeadsInCreatedCohort.reduce((acc, l) => {
            const reason = l.motivoPerda || 'N/A';
            if (reason !== 'N/A') acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([reason, count]) => ({ reason, count }))
    };
    
    // --- 2. Funnel, Conversions, and Alert (based on leads CREATED in period) ---
    const stageProgressCounts = FUNNEL_STAGES_ORDER.reduce((acc, stage) => ({ ...acc, [stage]: 0 }), {} as Record<string, number>);
    const stageValues = { ...stageProgressCounts };
    const stageMap = new Map(FUNNEL_STAGES_ORDER.map((stage, i) => [stage, i]));
    
    currentCrmData.forEach(l => {
        const leadStageIndex = stageMap.get(l.status);
        if (leadStageIndex !== undefined) {
            for (let i = 0; i <= leadStageIndex; i++) {
                stageProgressCounts[FUNNEL_STAGES_ORDER[i]]++;
            }
        }
        if (ACTIVE_PIPELINE_STAGES.includes(l.status) || l.status === 'ganho') {
             stageValues[l.status] = (stageValues[l.status] || 0) + l.valor;
        }
    });

    const funnelConversions: FunnelConversion[] = [];
    for (let i = 0; i < FUNNEL_STAGES_ORDER.length - 1; i++) {
        const from = FUNNEL_STAGES_ORDER[i];
        const to = FUNNEL_STAGES_ORDER[i + 1];
        const fromCount = stageProgressCounts[from] || 0;
        const toCount = stageProgressCounts[to] || 0;
        funnelConversions.push({ from, to, fromCount, toCount, rate: fromCount > 0 ? (toCount / fromCount) * 100 : 0 });
    }
    closedSales.conversion = funnelConversions.find(c => c.to === 'ganho')?.rate ?? 0;
    
    const getStageKpi = (stage: string) => ({
        count: currentCrmData.filter(l => l.status === stage).length,
        value: currentCrmData.filter(l => l.status === stage).reduce((s, l) => s + l.valor, 0),
        conversion: funnelConversions.find(c => c.to === stage)?.rate ?? 0,
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newLeadsToday = currentCrmData.filter(l => l.dataCriacao && (new Date(l.dataCriacao).setHours(0,0,0,0) === today.getTime()));
    const newLeadsTodayKpi = { count: newLeadsToday.length, value: newLeadsToday.reduce((sum, lead) => sum + lead.valor, 0) };
    const totalLeadsKpi = { count: currentCrmData.length, value: currentCrmData.reduce((s, l) => s + l.valor, 0), conversionToNext: funnelConversions.find(c => c.from === 'leads')?.rate ?? 0 };
    const activeLeadsKpi = { count: activePipelineLeads.length, value: activePipelineLeads.reduce((s, l) => s + l.valor, 0) };
    
    const notApproachedCount = currentCrmData.filter(l => l.prospeccao === 'Não abordado').length;
    const lastAttemptCount = currentCrmData.filter(l => l.status === 'em prospecção' && l.prospeccao === 'Última Tentativa').length;
    const lastFupCount = currentCrmData.filter(l => l.status === 'em follow up' && l.followUp === 'Último Fup').length;
    let alert: Alert | null = null;
    
    if(notApproachedCount > 0 || lastAttemptCount > 0 || lastFupCount > 0) {
        const valueAtRisk = currentCrmData.filter(l => l.prospeccao === 'Não abordado' || l.prospeccao === 'Última Tentativa' || l.followUp === 'Último Fup').reduce((sum, l) => sum + l.valor, 0);
        alert = { type: 'critical', title: `AÇÃO URGENTE: ${notApproachedCount + lastAttemptCount + lastFupCount} leads em risco de perda!`, message: 'Ação imediata necessária para evitar a perda destas oportunidades.', details: [`Não abordados: ${notApproachedCount}`, `Última tentativa de contato: ${lastAttemptCount}`, `Último follow up: ${lastFupCount}`], valueAtRisk };
    } else {
        const bottleneck = funnelConversions.length > 0 ? funnelConversions.reduce((min, c) => c.rate < min.rate ? c : min) : null;
        if(bottleneck && bottleneck.rate < 20) {
            const key = `${bottleneck.from}_${bottleneck.to}`;
            alert = { type: 'bottleneck', title: 'GARGALO IDENTIFICADO!', message: `Apenas ${bottleneck.rate.toFixed(1)}% dos leads avançam de ${bottleneck.from} para ${bottleneck.to}.`, details: [`Ação sugerida: ${SUGGESTIONS[key] || 'Analisar o processo desta etapa.'}`] };
        }
    }
    
    const prospecting = { totalInStage: currentCrmData.filter(l => l.status === 'em prospecção').length, distribution: ['Não abordado','Tentativa 1','Tentativa 2','Tentativa 3','Tentativa 4','Última Tentativa'].map(name => ({ name, count: currentCrmData.filter(l => l.status === 'em prospecção' && l.prospeccao === name).length, percentage: 0})), atRisk: { notApproached: notApproachedCount, lastAttempt: lastAttemptCount, total: notApproachedCount + lastAttemptCount, value: currentCrmData.filter(l => ['Não abordado', 'Última Tentativa'].includes(l.prospeccao)).reduce((s,l)=>s+l.valor,0) }, successRate: [] };
    const followUp = { totalInStage: currentCrmData.filter(l => l.status === 'em follow up').length, distribution: ['Proposta Enviada', 'Fup 1', 'Fup 2', 'Fup 3', 'Fup 4', 'Último Fup'].map(name => ({ name, count: currentCrmData.filter(l => l.status === 'em follow up' && l.followUp === name).length })), urgent: { lastFup: { count: lastFupCount, value: currentCrmData.filter(l => l.followUp === 'Último Fup').reduce((s, l) => s + l.valor, 0) }, stale7days: currentCrmData.filter(l => l.status === 'em follow up' && diffInDays(new Date(), l.dataAtualizacao) > 7).length, stale14days: currentCrmData.filter(l => l.status === 'em follow up' && diffInDays(new Date(), l.dataAtualizacao) > 14).length, }, closingPerformance: [], avgTimeInFollowUp: 0 };
    
    const avgTotalCycleTime = wonLeadsWithDateCurrent.length > 0 ? wonLeadsWithDateCurrent.reduce((s, l) => s + diffInDays(l.dataFechamento!, l.dataCriacao), 0) / wonLeadsWithDateCurrent.length : 0;
    
    const byResponsible = calculateResponsibleAnalysis(allCrmData, avgTotalCycleTime, closedSales.avgTicket.current);
    // FIX: Pass `wonLeadsCurrent` to `calculateCampaignAnalysis` to resolve a scope issue.
    const campaignAnalysis = calculateCampaignAnalysis(currentCrmData, allCrmData, currentCampaignData, allCampaignData, dateRange, wonLeadsCurrent);
    const forecast = calculateForecastAnalysis(currentCrmData, avgTotalCycleTime);
    const timeFunnel = calculateTimeFunnelAnalysis(avgTotalCycleTime);
    const velocity = calculateFunnelVelocity(wonLeadsWithDateCurrent, currentCrmData, byResponsible);

    return { totalLeadsKpi, newLeadsTodayKpi, activeLeadsKpi, closedSales, lostLeads: lostLeadsData, geralConversion, prospeccaoKpi: getStageKpi('em prospecção'), propostaKpi: getStageKpi('reunião de proposta'), followUpKpi: getStageKpi('em follow up'), negociacaoKpi: getStageKpi('em negociação'), alert, prospecting, followUp, campaigns: campaignAnalysis, byResponsible, forecast, timeFunnel, velocity, visualFunnel: { stages: FUNNEL_STAGES_ORDER.map(stage => ({ name: stage, count: stageProgressCounts[stage] || 0, value: stageValues[stage] || 0, subStages: stage === 'em prospecção' ? prospecting.distribution : (stage === 'em follow up' ? followUp.distribution : undefined) })), conversions: funnelConversions, bottleneck: alert?.type === 'bottleneck' ? funnelConversions.reduce((min, c) => c.rate < min.rate ? c : min) : null, opportunity: null } };
};

// --- Sub-calculators for new sections ---
const calculateResponsibleAnalysis = (crmData: CrmData[], globalAvgTime: number, globalAvgTicket: number): ResponsibleAnalysis => {
    const reps = Array.from(new Set(crmData.map(l => l.responsavel).filter(r => r && r !== 'N/A')));
    const detailed: ResponsibleData[] = reps.map(rep => {
        const repLeads = crmData.filter(l => l.responsavel === rep);
        const wonLeads = repLeads.filter(l => l.status === 'ganho');
        const wonLeadsWithDate = wonLeads.filter(l => l.dataFechamento);
        const totalValue = wonLeads.reduce((s, l) => s + l.valor, 0);
        const conversionRate = repLeads.length > 0 ? (wonLeads.length / repLeads.length) * 100 : 0;
        const avgTicket = wonLeads.length > 0 ? totalValue / wonLeads.length : 0;
        const avgTimeToClose = wonLeadsWithDate.length > 0 ? wonLeadsWithDate.reduce((s, l) => s + diffInDays(l.dataFechamento!, l.dataCriacao), 0) / wonLeadsWithDate.length : 0;
        
        let score = 0;
        if (conversionRate > 15) score += 2; else if (conversionRate > 10) score +=1;
        if (avgTicket > globalAvgTicket) score += 1;
        if (avgTimeToClose > 0 && avgTimeToClose < globalAvgTime) score += 1;
        if (wonLeads.length >= 3) score += 1;

        return { name: rep, totalLeads: repLeads.length, sales: wonLeads.length, conversionRate, totalValue, avgTicket, avgTimeToClose, score: Math.min(5, score) };
    }).sort((a,b) => b.totalValue - a.totalValue);

    return { ranking: detailed.slice(0, 3), performanceChart: { labels: detailed.map(r => r.name), sales: detailed.map(r => r.sales), values: detailed.map(r => r.totalValue) }, detailed };
}

const calculateForecastAnalysis = (crmData: CrmData[], avgCycleTime: number): ForecastAnalysis => {
    const activeLeads = crmData.filter(l => ['em negociação', 'em follow up'].includes(l.status));
    const leads = activeLeads.map(lead => {
        const daysInPipe = diffInDays(new Date(), lead.dataCriacao);
        const cycleProgress = avgCycleTime > 0 ? (daysInPipe / avgCycleTime) : 0;
        let probability = 0;
        if (lead.status === 'em negociação') probability = Math.min(cycleProgress * 100, 95);
        else if (lead.status === 'em follow up') probability = Math.min(cycleProgress * 80, 85);

        return { name: lead.nome, status: lead.status, value: lead.valor, probability, daysInStage: diffInDays(new Date(), lead.dataAtualizacao), responsible: lead.responsavel };
    }).sort((a,b) => b.probability - a.probability);

    const expectedValue = leads.reduce((sum, l) => sum + (l.value * (l.probability / 100)), 0);
    const expectedSales = leads.reduce((sum, l) => sum + (l.probability / 100), 0);
    
    return { next7Days: { sales: { min: Math.floor(expectedSales * 0.8), max: Math.ceil(expectedSales * 1.2) }, value: { min: Math.floor(expectedValue * 0.8), max: Math.ceil(expectedValue * 1.2) } }, leads };
}

const calculateTimeFunnelAnalysis = (avgCycleTime: number): TimeFunnelAnalysis => {
    if(avgCycleTime <= 0) return { stages: [], total: 0, bottleneck: null };
    const stageDistribution = { 'em prospecção': 0.4, 'reunião de triagem': 0.1, 'reunião de proposta': 0.15, 'em follow up': 0.25, 'em negociação': 0.1 };
    const stages = TIME_FUNNEL_STAGES_ORDER.map(name => ({ name, days: avgCycleTime * stageDistribution[name as keyof typeof stageDistribution] }));
    const bottleneck = stages.length > 0 ? stages.reduce((max, s) => s.days > max.days ? s : max).name : null;
    return { stages, total: avgCycleTime, bottleneck };
}

const calculateFunnelVelocity = (wonLeadsWithDate: CrmData[], crmData: CrmData[], byResponsible: ResponsibleAnalysis): FunnelVelocity => {
     const salesByDayOfWeek = wonLeadsWithDate.reduce((acc, lead) => {
        const day = lead.dataFechamento!.getDay();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, [] as number[]);
    
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const velocityByResponsible = byResponsible.detailed.map(r => ({ name: r.name, avgDays: r.avgTimeToClose }));
    
    return { avgTotalCycleTime: wonLeadsWithDate.length > 0 ? wonLeadsWithDate.reduce((s, l) => s + diffInDays(l.dataFechamento!, l.dataCriacao), 0) / wonLeadsWithDate.length : 0, staleLeads: { '7_days': crmData.filter(l => ACTIVE_PIPELINE_STAGES.includes(l.status) && diffInDays(new Date(), l.dataAtualizacao) > 7).length, '14_days': crmData.filter(l => ACTIVE_PIPELINE_STAGES.includes(l.status) && diffInDays(new Date(), l.dataAtualizacao) > 14).length, '30_days': crmData.filter(l => ACTIVE_PIPELINE_STAGES.includes(l.status) && diffInDays(new Date(), l.dataAtualizacao) > 30).length, }, byResponsible: velocityByResponsible, salesByDayOfWeek: { labels: days, data: days.map((_, i) => salesByDayOfWeek[i] || 0) }, avgTimeToStage: [] };
}

// FIX: Update signature to accept `wonLeadsCurrent` which is needed for calculations within this function.
const calculateCampaignAnalysis = (
    currentCrmData: CrmData[],
    allCrmData: CrmData[],
    currentCampaignData: CampaignData[],
    allCampaignData: CampaignData[],
    dateRange: { startDate: Date | null, endDate: Date | null },
    wonLeadsCurrent: CrmData[]
): CampaignAnalysis => {
    let previousPeriodCampaignData: CampaignData[] = [], previousPeriodCrmData: CrmData[] = [];
    if (dateRange.startDate && dateRange.endDate) {
        const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
        const prevEnd = new Date(dateRange.startDate.getTime() - 1), prevStart = new Date(prevEnd.getTime() - duration);
        previousPeriodCampaignData = allCampaignData.filter(d => d.dataInicio >= prevStart && d.dataInicio <= prevEnd);
        previousPeriodCrmData = allCrmData.filter(d => d.dataCriacao >= prevStart && d.dataCriacao <= prevEnd);
    }
    
    const salesFromMetaAdsInPeriod = allCrmData.filter(sale => {
        if (sale.source !== 'Meta Ads' || sale.status !== 'ganho' || !sale.dataFechamento) { return false; }
        if (dateRange.startDate && dateRange.endDate) {
            const inclusiveEndDate = new Date(dateRange.endDate);
            inclusiveEndDate.setHours(23, 59, 59, 999);
            return sale.dataFechamento >= dateRange.startDate && sale.dataFechamento <= inclusiveEndDate;
        }
        return true; 
    });

    const leadsFromMetaAdsInPeriod = currentCrmData.filter(l => l.source === 'Meta Ads');
    
    const salesFromMetaAdsPrevPeriod = allCrmData.filter(sale => {
        if (sale.source !== 'Meta Ads' || sale.status !== 'ganho' || !sale.dataFechamento) return false;
        if (dateRange.startDate && dateRange.endDate) {
            const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
            const prevEnd = new Date(dateRange.startDate.getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - duration);
            return sale.dataFechamento >= prevStart && sale.dataFechamento <= prevEnd;
        }
        return false;
    });

    const aggregatedCampaigns = Object.values(currentCampaignData.reduce((acc, c) => {
        const name = c.nome || 'Campanha Desconhecida';
        if (!acc[name]) acc[name] = { name, investment: 0, leads: 0 };
        acc[name].investment += c.valorUsado;
        acc[name].leads += (c.leads + c.leadFormulario);
        return acc;
    }, {} as Record<string, any>));

    const detailedCampaigns: CampaignPerformanceData[] = aggregatedCampaigns.map(campaign => {
        const campaignSales = salesFromMetaAdsInPeriod.filter(sale => sale.campaign === campaign.name);
        const salesCount = campaignSales.length;
        const wonValue = campaignSales.reduce((sum, sale) => sum + sale.valor, 0);
        const investment = campaign.investment;
        const leads = campaign.leads;
        const roi = investment > 0 ? ((wonValue - investment) / investment) * 100 : (wonValue > 0 ? Infinity : 0);
        const cpl = leads > 0 ? investment / leads : 0;
        const conversionRate = leads > 0 ? (salesCount / leads) * 100 : 0;
        const salesWithDate = campaignSales.filter(s => s.dataFechamento);
        const avgTimeToSale = salesWithDate.length > 0 ? salesWithDate.reduce((sum, sale) => sum + diffInDays(sale.dataFechamento!, sale.dataCriacao), 0) / salesWithDate.length : 0;
        const responsibleCounts = campaignSales.reduce((acc, sale) => { const resp = sale.responsavel || 'N/A'; if (resp !== 'N/A') { acc[resp] = (acc[resp] || 0) + 1; } return acc; }, {} as Record<string, number>);
        const topResponsible = Object.entries(responsibleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        return { name: campaign.name, investment, leads, sales: salesCount, wonValue: wonValue, roi: roi, cpl: cpl, conversionRate: conversionRate, avgTimeToSale: avgTimeToSale, topResponsible: topResponsible };
    });
    
    const investment = { current: aggregatedCampaigns.reduce((s, c) => s + c.investment, 0), previous: previousPeriodCampaignData.reduce((s, c) => s + c.valorUsado, 0), change: 0 };
    investment.change = calculateChange(investment.current, investment.previous);
    const totalLeadsFromCampaigns = aggregatedCampaigns.reduce((s, c) => s + c.leads, 0);
    const leads = { current: totalLeadsFromCampaigns, previous: previousPeriodCampaignData.reduce((s, c) => s + c.leads + c.leadFormulario, 0), change: 0 };
    leads.change = calculateChange(leads.current, leads.previous);
    const cpl = { current: leads.current > 0 ? investment.current / leads.current : 0, previous: leads.previous > 0 ? investment.previous / leads.previous : 0, change: 0 };
    cpl.change = calculateChange(cpl.current, cpl.previous);
    
    const totalWonValue = salesFromMetaAdsInPeriod.reduce((s, c) => s + c.valor, 0);
    const roi = investment.current > 0 ? ((totalWonValue - investment.current) / investment.current) * 100 : totalWonValue > 0 ? Infinity : 0;
    
    const cac = salesFromMetaAdsInPeriod.length > 0 ? investment.current / salesFromMetaAdsInPeriod.length : 0;
    const avgTicketTotal = wonLeadsCurrent.length > 0 ? wonLeadsCurrent.reduce((s, l) => s + l.valor, 0) / wonLeadsCurrent.length : 0;
    const ltvCacRatio = cac > 0 ? (avgTicketTotal * 6) / cac : 0;

    const leadToSaleConversion = { current: leadsFromMetaAdsInPeriod.length > 0 ? (salesFromMetaAdsInPeriod.length / leadsFromMetaAdsInPeriod.length) * 100 : 0, previous: previousPeriodCrmData.filter(l => l.source === 'Meta Ads').length > 0 ? (salesFromMetaAdsPrevPeriod.length / previousPeriodCrmData.filter(l => l.source === 'Meta Ads').length) * 100 : 0, change: 0, diff: 0 };
    leadToSaleConversion.diff = leadToSaleConversion.current - leadToSaleConversion.previous;
    leadToSaleConversion.change = calculateChange(leadToSaleConversion.current, leadToSaleConversion.previous);

    const salesFromMetaAdsWithDate = salesFromMetaAdsInPeriod.filter(l => l.dataFechamento);
    const avgTimeToSale = salesFromMetaAdsWithDate.length > 0 ? salesFromMetaAdsWithDate.reduce((s, l) => s + diffInDays(l.dataFechamento!, l.dataCriacao), 0) / salesFromMetaAdsWithDate.length : 0;

    const sortedCampaigns = [...detailedCampaigns].sort((a, b) => {
        const roiA = a.roi; const roiB = b.roi;
        if (isFinite(roiA) && isFinite(roiB)) { return roiB - roiA; }
        if (!isFinite(roiA) && roiA > 0) { return -1; }
        if (!isFinite(roiB) && roiB > 0) { return 1; }
        return roiB - roiA;
    });

    return { investment, leads, cpl, roi: roi, wonValue: totalWonValue, cac, ltvCacRatio, leadToSaleConversion, avgTimeToSale, salesCount: salesFromMetaAdsInPeriod.length, metaAdsLeadsCount: leadsFromMetaAdsInPeriod.length, bestCampaign: sortedCampaigns[0] || null, topCampaignsByInvestment: [...detailedCampaigns].sort((a, b) => b.investment - a.investment).slice(0, 5), roiBubbleData: detailedCampaigns.filter(c => c.investment > 0 && c.leads > 0).map(c => ({ x: c.cpl, y: c.conversionRate, r: c.wonValue > 0 ? Math.max(5, c.wonValue / 100) : 5, name: c.name, roi: c.roi, sales: c.sales, investment: c.investment })), detailedCampaigns: detailedCampaigns.sort((a,b) => b.investment - a.investment), evolutionData: { labels: [], investment: [], leads: [], sales: [] } };
};