import { CrmData, CampaignData, DashboardGeralMetrics, FunnelConversion, FunnelStage, Alert, CampaignPerformanceData, CampaignAnalysis, ResponsibleAnalysis, ForecastAnalysis, TimeFunnelAnalysis, ResponsibleData, FunnelVelocity, LossAnalysis, QualityAnalysis, AcquisitionAnalysis, ContractsAnalysis } from '../types';

const FUNNEL_STAGES_ORDER = ['novo lead', 'tentativa de contato', 'contato feito', 'qualificado', 'call agendada', 'call realizada', 'em follow up', 'ganho'];
const ACTIVE_PIPELINE_STAGES = ['tentativa de contato', 'contato feito', 'qualificado', 'call agendada', 'call realizada', 'em follow up'];
const TIME_FUNNEL_STAGES_ORDER = ['tentativa de contato', 'contato feito', 'qualificado', 'call agendada', 'call realizada', 'em follow up'];
const WON_STATUSES = ['ganho', 'venda']; // Now accepts both 'ganho' and 'venda'

const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? Infinity : 0;
    return ((current - previous) / previous) * 100;
};

const diffInDays = (date1: Date, date2: Date): number => {
    if(!date1 || !date2) return 0;
    return (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
}

// HELPER: Calculate Total Contract Value (TCV) based on monthly value * duration
// Respects "Pagamento" type: if 'a vista', it does not multiply.
export const getLeadValue = (lead: CrmData): number => {
    const pagamento = (lead.pagamento || '').toLowerCase();
    
    // Check for "a vista" or "único" or similar one-time payment indicators
    if (pagamento.includes('vista') || pagamento.includes('pontual') || pagamento.includes('unico') || pagamento.includes('único')) {
        return lead.valor;
    }

    // Default behavior (MRR/Recurring)
    // If tempoContrato is defined and > 0, use it. 
    // If NOT defined, default to 1 (do NOT assume 12 months, use the raw value).
    const duration = (lead.tempoContrato && lead.tempoContrato > 0) ? lead.tempoContrato : 1;
    
    return lead.valor * duration;
};

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
    currentCrmData: CrmData[], // This is the COHORT of leads CREATED in the period
    allCrmData: CrmData[],
    currentCampaignData: CampaignData[],
    allCampaignData: CampaignData[],
    dateRange: { startDate: Date | null, endDate: Date | null }
): DashboardGeralMetrics | null => {
    if (allCrmData.length === 0) return null;

    let previousPeriodCrmData: CrmData[] = [];
    let prevStart: Date | null = null;
    let prevEnd: Date | null = null;

    if (dateRange.startDate && dateRange.endDate) {
        const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
        prevEnd = new Date(dateRange.startDate.getTime() - 1);
        prevStart = new Date(prevEnd.getTime() - duration);
        previousPeriodCrmData = allCrmData.filter(d => d.dataCriacao >= prevStart! && d.dataCriacao <= prevEnd!);
    }
    
    // --- ACTIVITY-BASED METRICS (What happened in the period) ---
    const inclusiveEndDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
    if(dateRange.endDate) inclusiveEndDate.setUTCHours(23, 59, 59, 999);

    // Sales: Leads CLOSED in the period (based on dataFechamento)
    const wonLeadsCurrent = allCrmData.filter(l => WON_STATUSES.includes(l.status) && l.dataFechamento && l.dataFechamento >= dateRange.startDate! && l.dataFechamento <= inclusiveEndDate);
    const wonLeadsPrev = prevStart && prevEnd ? allCrmData.filter(l => WON_STATUSES.includes(l.status) && l.dataFechamento && l.dataFechamento >= prevStart && l.dataFechamento <= prevEnd) : [];

    // Losses: Leads LOST in the period (based on dataAtualizacao)
    const lostLeadsCurrent = allCrmData.filter(l => l.status === 'perdido' && l.dataAtualizacao && l.dataAtualizacao >= dateRange.startDate! && l.dataAtualizacao <= inclusiveEndDate);
    const lostLeadsPrev = prevStart && prevEnd ? allCrmData.filter(l => l.status === 'perdido' && l.dataAtualizacao && l.dataAtualizacao >= prevStart && l.dataAtualizacao <= prevEnd) : [];

    // --- STATE-BASED METRICS (Current state of the world) ---
    // Total Pipeline: ALL leads currently in active stages, regardless of date.
    const totalActivePipelineLeads = allCrmData.filter(l => ACTIVE_PIPELINE_STAGES.includes(l.status));
    
    // --- COHORT-BASED METRICS (Performance of leads CREATED in the period) ---
    const wonLeadsFromCreatedCohort = currentCrmData.filter(l => WON_STATUSES.includes(l.status));
    const wonLeadsFromCreatedCohortPrev = previousPeriodCrmData.filter(l => WON_STATUSES.includes(l.status));

    // --- 1. Top KPIs ---
    const lastSaleLead = wonLeadsCurrent.length > 0 ? [...wonLeadsCurrent].sort((a,b) => b.dataFechamento!.getTime() - a.dataFechamento!.getTime())[0] : null;

    const closedSales = {
        count: { current: wonLeadsCurrent.length, previous: wonLeadsPrev.length, change: wonLeadsCurrent.length - wonLeadsPrev.length },
        value: { current: wonLeadsCurrent.reduce((s, l) => s + getLeadValue(l), 0), previous: wonLeadsPrev.reduce((s, l) => s + getLeadValue(l), 0), change: 0 },
        // AvgTicket now represents Average Contract Value (ACV)
        avgTicket: { current: wonLeadsCurrent.length > 0 ? wonLeadsCurrent.reduce((s, l) => s + getLeadValue(l), 0) / wonLeadsCurrent.length : 0, previous: 0, change: 0 },
        conversion: 0, // Will be filled later by funnel
        lastSale: lastSaleLead ? { daysAgo: diffInDays(new Date(), lastSaleLead.dataFechamento!), value: getLeadValue(lastSaleLead) } : null
    };
    closedSales.value.change = calculateChange(closedSales.value.current, closedSales.value.previous);
    closedSales.avgTicket.previous = wonLeadsPrev.length > 0 ? wonLeadsPrev.reduce((s, l) => s + getLeadValue(l), 0) / wonLeadsPrev.length : 0;
    closedSales.avgTicket.change = calculateChange(closedSales.avgTicket.current, closedSales.avgTicket.previous);

    const lostLeadsData = {
        count: { current: lostLeadsCurrent.length, previous: lostLeadsPrev.length, change: lostLeadsCurrent.length - lostLeadsPrev.length },
        value: lostLeadsCurrent.reduce((s, l) => s + getLeadValue(l), 0),
        avgValue: lostLeadsCurrent.length > 0 ? lostLeadsCurrent.reduce((s, l) => s + getLeadValue(l), 0) / lostLeadsCurrent.length : 0,
        topReasons: Object.entries(lostLeadsCurrent.reduce((acc, l) => {
            const reason = l.motivoPerda || 'N/A';
            if (reason !== 'N/A') acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([reason, count]) => ({ reason, count }))
    };
    
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

    // Use totalActivePipelineLeads for this KPI
    const activeLeadsKpi = { 
        count: totalActivePipelineLeads.length, 
        value: totalActivePipelineLeads.reduce((s, l) => s + getLeadValue(l), 0) 
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newLeadsToday = allCrmData.filter(l => l.dataCriacao && (new Date(l.dataCriacao).setHours(0,0,0,0) === today.getTime()));
    const newLeadsTodayKpi = { count: newLeadsToday.length, value: newLeadsToday.reduce((sum, lead) => sum + getLeadValue(lead), 0) };
    
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
        if (ACTIVE_PIPELINE_STAGES.includes(l.status) || WON_STATUSES.includes(l.status)) {
             stageValues[l.status] = (stageValues[l.status] || 0) + getLeadValue(l);
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
        value: currentCrmData.filter(l => l.status === stage).reduce((s, l) => s + getLeadValue(l), 0),
        conversion: funnelConversions.find(c => c.to === stage)?.rate ?? 0,
    });
    
    const totalLeadsKpi = { count: currentCrmData.length, value: currentCrmData.reduce((s, l) => s + getLeadValue(l), 0), conversionToNext: funnelConversions.find(c => c.from === 'novo lead')?.rate ?? 0 };
    
    const notApproachedCount = allCrmData.filter(l => l.status === 'tentativa de contato' && l.prospeccao === 'Não abordado').length;
    const lastAttemptCount = allCrmData.filter(l => l.status === 'tentativa de contato' && l.prospeccao === 'Última Tentativa').length;
    const lastFupCount = allCrmData.filter(l => l.status === 'em follow up' && l.followUp === 'Último Fup').length;
    let alert: Alert | null = null;
    
    if(notApproachedCount > 0 || lastAttemptCount > 0 || lastFupCount > 0) {
        const valueAtRisk = allCrmData.filter(l => (l.status === 'tentativa de contato' && ['Não abordado', 'Última Tentativa'].includes(l.prospeccao)) || (l.status === 'em follow up' && l.followUp === 'Último Fup')).reduce((sum, l) => sum + getLeadValue(l), 0);
        alert = { type: 'critical', title: `AÇÃO URGENTE: ${notApproachedCount + lastAttemptCount + lastFupCount} leads em risco de perda!`, message: 'Ação imediata necessária para evitar a perda destas oportunidades.', details: [`Não abordados: ${notApproachedCount}`, `Última tentativa de contato: ${lastAttemptCount}`, `Último follow up: ${lastFupCount}`], valueAtRisk };
    } else {
        const bottleneck = funnelConversions.length > 0 ? funnelConversions.reduce((min, c) => c.rate < min.rate ? c : min) : null;
        if(bottleneck && bottleneck.rate < 20) {
            const key = `${bottleneck.from}_${bottleneck.to}`;
            alert = { type: 'bottleneck', title: 'GARGALO IDENTIFICADO!', message: `Apenas ${bottleneck.rate.toFixed(1)}% dos leads avançam de ${bottleneck.from} para ${bottleneck.to}.`, details: [`Ação sugerida: ${SUGGESTIONS[key] || 'Analisar o processo desta etapa.'}`] };
        }
    }
    
    const prospecting = { totalInStage: allCrmData.filter(l => l.status === 'tentativa de contato').length, distribution: ['Não abordado','Tentativa 1','Tentativa 2','Tentativa 3','Tentativa 4','Última Tentativa'].map(name => ({ name, count: allCrmData.filter(l => l.status === 'tentativa de contato' && l.prospeccao === name).length, percentage: 0})), atRisk: { notApproached: notApproachedCount, lastAttempt: lastAttemptCount, total: notApproachedCount + lastAttemptCount, value: allCrmData.filter(l => l.status === 'tentativa de contato' && ['Não abordado', 'Última Tentativa'].includes(l.prospeccao)).reduce((s,l)=>s+getLeadValue(l),0) }, successRate: [] };
    const followUp = { totalInStage: allCrmData.filter(l => l.status === 'em follow up').length, distribution: ['Proposta Enviada', 'Fup 1', 'Fup 2', 'Fup 3', 'Fup 4', 'Último Fup'].map(name => ({ name, count: allCrmData.filter(l => l.status === 'em follow up' && l.followUp === name).length })), urgent: { lastFup: { count: lastFupCount, value: allCrmData.filter(l => l.status === 'em follow up' && l.followUp === 'Último Fup').reduce((s, l) => s + getLeadValue(l), 0) }, stale7days: allCrmData.filter(l => l.status === 'em follow up' && diffInDays(new Date(), l.dataAtualizacao) > 7).length, stale14days: allCrmData.filter(l => l.status === 'em follow up' && diffInDays(new Date(), l.dataAtualizacao) > 14).length, }, closingPerformance: [], avgTimeInFollowUp: 0 };
    
    const avgTotalCycleTime = wonLeadsCurrent.length > 0 
        ? wonLeadsCurrent.reduce((s, l) => s + diffInDays(l.dataFechamento!, l.dataCriacao), 0) / wonLeadsCurrent.length 
        : 0;
    
    const byResponsible = calculateResponsibleAnalysis(allCrmData, avgTotalCycleTime, closedSales.avgTicket.current);
    
    const campaignAnalysis = calculateCampaignAnalysis(currentCrmData, allCrmData, currentCampaignData, allCampaignData, dateRange, wonLeadsCurrent);
    const forecast = calculateForecastAnalysis(allCrmData, avgTotalCycleTime);
    const timeFunnel = calculateTimeFunnelAnalysis(avgTotalCycleTime);
    const velocity = calculateFunnelVelocity(wonLeadsCurrent, allCrmData, byResponsible);

    // --- NEW ANALYSES ---
    const lossAnalysis = calculateLossAnalysis(allCrmData); // Use all data for better stats
    const qualityAnalysis = calculateQualityAnalysis(allCrmData);
    const acquisitionAnalysis = calculateAcquisitionAnalysis(allCrmData);
    const contractsAnalysis = calculateContractsAnalysis(allCrmData);

    return { totalLeadsKpi, newLeadsTodayKpi, activeLeadsKpi, closedSales, lostLeads: lostLeadsData, geralConversion, prospeccaoKpi: getStageKpi('tentativa de contato'), propostaKpi: getStageKpi('call agendada'), followUpKpi: getStageKpi('em follow up'), negociacaoKpi: getStageKpi('em follow up'), alert, prospecting, followUp, campaigns: campaignAnalysis, byResponsible, forecast, timeFunnel, velocity, lossAnalysis, qualityAnalysis, acquisitionAnalysis, contractsAnalysis, visualFunnel: { stages: FUNNEL_STAGES_ORDER.map(stage => ({ name: stage, count: stageProgressCounts[stage] || 0, value: stageValues[stage] || 0, subStages: stage === 'tentativa de contato' ? prospecting.distribution : (stage === 'em follow up' ? followUp.distribution : undefined) })), conversions: funnelConversions, bottleneck: alert?.type === 'bottleneck' ? funnelConversions.reduce((min, c) => c.rate < min.rate ? c : min) : null, opportunity: null } };
};

// --- Sub-calculators ---

const calculateLossAnalysis = (crmData: CrmData[]): LossAnalysis => {
    const lostLeads = crmData.filter(l => l.status === 'perdido');
    const totalLost = lostLeads.length;
    
    // 1. Motivos
    const reasonsMap = lostLeads.reduce((acc, l) => {
        const r = l.motivoPerda || 'Não informado';
        acc[r] = (acc[r] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    const reasons = Object.entries(reasonsMap)
        .map(([reason, count]) => ({ reason, count, percentage: totalLost > 0 ? (count/totalLost)*100 : 0 }))
        .sort((a,b) => b.count - a.count);

    // 2. Tentativas (Parse "Tentativa X" or "Fup X")
    const extractAttempt = (str: string): number | null => {
        const match = str.match(/(?:Tentativa|Fup)\s*(\d+)/i);
        return match ? parseInt(match[1]) : null;
    };

    const wins = crmData.filter(l => WON_STATUSES.includes(l.status));
    
    const attemptsToWinValues = wins.map(l => {
        // Assume last attempt recorded is the winning one
        // Check both prospeccao and followUp fields
        const p = extractAttempt(l.prospeccao);
        const f = extractAttempt(l.followUp);
        return f ? f + 4 : (p || 1); // Rough estimate: Fup starts after ~4 prospecting steps? Or just take max
    }).filter(n => n > 0);
    
    const attemptsToLoseValues = lostLeads.map(l => {
        const p = extractAttempt(l.prospeccao);
        const f = extractAttempt(l.followUp);
        return Math.max(p || 0, f || 0);
    }).filter(n => n > 0);

    const avgWin = attemptsToWinValues.length > 0 ? attemptsToWinValues.reduce((a,b)=>a+b,0)/attemptsToWinValues.length : 0;
    const avgLose = attemptsToLoseValues.length > 0 ? attemptsToLoseValues.reduce((a,b)=>a+b,0)/attemptsToLoseValues.length : 0;

    // Distribution for chart
    const maxAttempt = Math.max(
        ...attemptsToWinValues, 
        ...attemptsToLoseValues, 
        5 // minimum visualization range
    );
    
    const winsDist = Array(maxAttempt + 1).fill(0);
    const lossDist = Array(maxAttempt + 1).fill(0);
    attemptsToWinValues.forEach(a => winsDist[a] = (winsDist[a]||0) + 1);
    attemptsToLoseValues.forEach(a => lossDist[a] = (lossDist[a]||0) + 1);

    return {
        reasons,
        attemptsToWin: avgWin,
        attemptsToLose: avgLose,
        attemptsDistribution: {
            labels: Array.from({length: maxAttempt}, (_, i) => `${i+1}ª`),
            wins: winsDist.slice(1),
            losses: lossDist.slice(1)
        }
    };
};

const calculateQualityAnalysis = (crmData: CrmData[]): QualityAnalysis => {
    // Helper
    const calcStats = (data: CrmData[]) => {
        const total = data.length;
        const wins = data.filter(l => WON_STATUSES.includes(l.status)).length;
        // Use TCV for pipeline and ticket
        const pipeline = data.filter(l => ACTIVE_PIPELINE_STAGES.includes(l.status)).reduce((s,l)=>s+getLeadValue(l),0);
        const avgTicket = wins > 0 ? data.filter(l => WON_STATUSES.includes(l.status)).reduce((s,l)=>s+getLeadValue(l),0) / wins : 0;
        return { total, wins, rate: total > 0 ? (wins/total)*100 : 0, pipeline, avgTicket };
    };

    // 1. Temperature
    const temps = ['QUENTE', 'MORNO', 'FRIO'];
    const temperature = temps.map(t => ({
        label: t,
        ...calcStats(crmData.filter(l => l.temperatura === t))
    }));

    // 2. ABC
    const abcs = ['A', 'B', 'C'];
    const abc = abcs.map(c => ({
        label: c,
        ...calcStats(crmData.filter(l => l.abc === c))
    }));

    // 3. Services (Group by cleaned service name)
    const serviceMap = crmData.reduce((acc, l) => {
        const s = l.servico || 'Não definido';
        if (!acc[s]) acc[s] = [];
        acc[s].push(l);
        return acc;
    }, {} as Record<string, CrmData[]>);
    
    const services = Object.entries(serviceMap).map(([label, leads]) => ({
        label,
        ...calcStats(leads)
    })).sort((a,b) => b.total - a.total);

    return { temperature, abc, services };
};

const calculateAcquisitionAnalysis = (crmData: CrmData[]): AcquisitionAnalysis => {
    // 1. Sources
    const sourceMap = crmData.reduce((acc, l) => {
        const s = l.source || 'Desconhecido';
        if (!acc[s]) acc[s] = [];
        acc[s].push(l);
        return acc;
    }, {} as Record<string, CrmData[]>);

    const sources = Object.entries(sourceMap).map(([label, leads]) => {
        const wins = leads.filter(l => WON_STATUSES.includes(l.status)).length;
        const total = leads.length;
        return {
            label,
            total,
            rate: total > 0 ? (wins/total)*100 : 0,
            pipeline: leads.filter(l => ACTIVE_PIPELINE_STAGES.includes(l.status)).reduce((s,l)=>s+getLeadValue(l),0)
        };
    }).sort((a,b) => b.total - a.total);

    // 2. Evolution (Weekly)
    const weeks: Record<string, number> = {};
    const sortedLeads = [...crmData].sort((a,b) => a.dataCriacao.getTime() - b.dataCriacao.getTime());
    
    sortedLeads.forEach(l => {
        if(!l.dataCriacao) return;
        // Get start of week
        const d = new Date(l.dataCriacao);
        const day = d.getUTCDay(), diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const key = `${monday.getUTCDate()}/${monday.getUTCMonth()+1}`;
        weeks[key] = (weeks[key] || 0) + 1;
    });

    const labels = Object.keys(weeks).slice(-8); // Last 8 weeks
    const count = labels.map(k => weeks[k]);

    return { sources, evolution: { labels, count } };
};

const calculateContractsAnalysis = (crmData: CrmData[]): ContractsAnalysis => {
    const wonLeads = crmData.filter(l => WON_STATUSES.includes(l.status));
    const totalWon = wonLeads.length;

    // 1. Duration Distribution
    const durationMap = wonLeads.reduce((acc, l) => {
        const k = l.tempoContrato ? `${l.tempoContrato} meses` : 'Outros';
        if(!acc[k]) acc[k] = { count: 0, value: 0 };
        acc[k].count++;
        acc[k].value += getLeadValue(l); // Use TCV
        return acc;
    }, {} as Record<string, {count: number, value: number}>);

    const duration = Object.entries(durationMap).map(([label, stats]) => ({
        label,
        count: stats.count,
        percentage: totalWon > 0 ? (stats.count/totalWon)*100 : 0,
        value: stats.value
    }));

    // 2. LTV
    const projectedLTVs = wonLeads.map(l => getLeadValue(l));
    const totalProjected = projectedLTVs.reduce((a,b) => a+b, 0);
    const average = totalWon > 0 ? totalProjected / totalWon : 0;

    // LTV by Service
    const ltvServiceMap = wonLeads.reduce((acc, l) => {
        const s = l.servico || 'Geral';
        if(!acc[s]) acc[s] = [];
        acc[s].push(getLeadValue(l));
        return acc;
    }, {} as Record<string, number[]>);

    const byService = Object.entries(ltvServiceMap).map(([service, ltvs]) => ({
        service,
        ltv: ltvs.reduce((a,b)=>a+b,0) / ltvs.length
    }));

    // 3. Future Revenue
    const today = new Date();
    let next3Months = 0;
    let next6Months = 0;
    let expiring90Days = 0;

    wonLeads.forEach(l => {
        if (!l.dataFechamento) return;
        const monthsDuration = l.tempoContrato || 12;
        const endDate = new Date(l.dataFechamento);
        endDate.setMonth(endDate.getMonth() + monthsDuration);
        
        // Calculate remaining months from now
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        const diffMonths = diffDays / 30;

        if (diffDays > 0) {
            // Revenue remaining for this client (using monthly value)
            const monthsToCount3 = Math.min(diffMonths, 3);
            next3Months += monthsToCount3 * l.valor;

            const monthsToCount6 = Math.min(diffMonths, 6);
            next6Months += monthsToCount6 * l.valor;

            if (diffDays <= 90) expiring90Days++;
        }
    });

    return {
        duration,
        ltv: { average, totalProjected, byService },
        futureRevenue: { next3Months, next6Months, expiring90Days }
    };
};

const calculateResponsibleAnalysis = (crmData: CrmData[], globalAvgTime: number, globalAvgTicket: number): ResponsibleAnalysis => {
    const reps = Array.from(new Set(crmData.map(l => l.responsavel).filter(r => r && r !== 'N/A')));
    const detailed: ResponsibleData[] = reps.map(rep => {
        const repLeads = crmData.filter(l => l.responsavel === rep);
        const wonLeads = repLeads.filter(l => WON_STATUSES.includes(l.status) && l.dataFechamento);
        const totalValue = wonLeads.reduce((s, l) => s + getLeadValue(l), 0); // Use TCV
        const conversionRate = repLeads.length > 0 ? (wonLeads.length / repLeads.length) * 100 : 0;
        const avgTicket = wonLeads.length > 0 ? totalValue / wonLeads.length : 0;
        const avgTimeToClose = wonLeads.length > 0 
            ? wonLeads.reduce((s, l) => s + diffInDays(l.dataFechamento!, l.dataCriacao), 0) / wonLeads.length 
            : 0;
        
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
    const activeLeads = crmData.filter(l => ['em follow up', 'call realizada'].includes(l.status));
    const leads = activeLeads.map(lead => {
        const daysInPipe = diffInDays(new Date(), lead.dataCriacao);
        const cycleProgress = avgCycleTime > 0 ? (daysInPipe / avgCycleTime) : 0;
        let probability = 0;
        if (lead.status === 'em follow up') probability = Math.min(cycleProgress * 80, 85);
        else if (lead.status === 'call realizada') probability = Math.min(cycleProgress * 100, 95);

        // Use TCV for forecast
        const tcv = getLeadValue(lead);

        return { name: lead.nome, status: lead.status, value: tcv, probability, daysInStage: diffInDays(new Date(), lead.dataAtualizacao), responsible: lead.responsavel };
    }).sort((a,b) => b.probability - a.probability);

    const expectedValue = leads.reduce((sum, l) => sum + (l.value * (l.probability / 100)), 0);
    const expectedSales = leads.reduce((sum, l) => sum + (l.probability / 100), 0);
    
    return { next7Days: { sales: { min: Math.floor(expectedSales * 0.8), max: Math.ceil(expectedSales * 1.2) }, value: { min: Math.floor(expectedValue * 0.8), max: Math.ceil(expectedValue * 1.2) } }, leads };
}

const calculateTimeFunnelAnalysis = (avgCycleTime: number): TimeFunnelAnalysis => {
    if(avgCycleTime <= 0) return { stages: [], total: 0, bottleneck: null };
    const stageDistribution = { 'tentativa de contato': 0.3, 'contato feito': 0.1, 'qualificado': 0.1, 'call agendada': 0.15, 'call realizada': 0.1, 'em follow up': 0.25 };
    const stages = TIME_FUNNEL_STAGES_ORDER.map(name => ({ name, days: avgCycleTime * stageDistribution[name as keyof typeof stageDistribution] }));
    const bottleneck = stages.length > 0 ? stages.reduce((max, s) => s.days > max.days ? s : max).name : null;
    return { stages, total: avgCycleTime, bottleneck };
}

const calculateFunnelVelocity = (wonLeadsWithDate: CrmData[], crmData: CrmData[], byResponsible: ResponsibleAnalysis): FunnelVelocity => {
     const salesByDayOfWeek = wonLeadsWithDate.reduce((acc, lead) => {
        const date = lead.dataFechamento;
        if (date) {
            const day = date.getUTCDay(); // Use getUTCDay since dates are UTC
            acc[day] = (acc[day] || 0) + 1;
        }
        return acc;
    }, [] as number[]);
    
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const velocityByResponsible = byResponsible.detailed.map(r => ({ name: r.name, avgDays: r.avgTimeToClose }));
    
    return { avgTotalCycleTime: wonLeadsWithDate.length > 0 ? wonLeadsWithDate.reduce((s, l) => s + diffInDays(l.dataFechamento!, l.dataCriacao), 0) / wonLeadsWithDate.length : 0, staleLeads: { '7_days': crmData.filter(l => ACTIVE_PIPELINE_STAGES.includes(l.status) && diffInDays(new Date(), l.dataAtualizacao) > 7).length, '14_days': crmData.filter(l => ACTIVE_PIPELINE_STAGES.includes(l.status) && diffInDays(new Date(), l.dataAtualizacao) > 14).length, '30_days': crmData.filter(l => ACTIVE_PIPELINE_STAGES.includes(l.status) && diffInDays(new Date(), l.dataAtualizacao) > 30).length, }, byResponsible: velocityByResponsible, salesByDayOfWeek: { labels: days, data: days.map((_, i) => salesByDayOfWeek[i] || 0) }, avgTimeToStage: [] };
}

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
    
    const salesFromMetaAdsInPeriod = wonLeadsCurrent.filter(sale => sale.source === 'Meta Ads');
    const leadsFromMetaAdsInPeriod = currentCrmData.filter(l => l.source === 'Meta Ads');
    
    const salesFromMetaAdsPrevPeriod = allCrmData.filter(sale => {
        if (sale.source !== 'Meta Ads' || !WON_STATUSES.includes(sale.status) || !sale.dataFechamento) return false;
        const date = sale.dataFechamento;
        if (dateRange.startDate && dateRange.endDate) {
            const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
            const prevEnd = new Date(dateRange.startDate.getTime() - 1);
            const prevStart = new Date(prevEnd.getTime() - duration);
            return date >= prevStart && date <= prevEnd;
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
        // Use TCV for campaign value
        const wonValue = campaignSales.reduce((sum, sale) => sum + getLeadValue(sale), 0);
        const investment = campaign.investment;
        const leads = campaign.leads;
        const roi = investment > 0 ? ((wonValue - investment) / investment) * 100 : (wonValue > 0 ? Infinity : 0);
        const cpl = leads > 0 ? investment / leads : 0;
        const conversionRate = leads > 0 ? (salesCount / leads) * 100 : 0;
        const avgTimeToSale = campaignSales.length > 0 ? campaignSales.reduce((sum, sale) => sum + diffInDays(sale.dataFechamento!, sale.dataCriacao), 0) / campaignSales.length : 0;
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
    
    // Use TCV for total won value
    const totalWonValue = salesFromMetaAdsInPeriod.reduce((s, c) => s + getLeadValue(c), 0);
    const roi = investment.current > 0 ? ((totalWonValue - investment.current) / investment.current) * 100 : totalWonValue > 0 ? Infinity : 0;
    
    const cac = salesFromMetaAdsInPeriod.length > 0 ? investment.current / salesFromMetaAdsInPeriod.length : 0;
    // Avg Ticket here should also represent ACV (TCV based)
    const avgTicketTotal = wonLeadsCurrent.length > 0 ? wonLeadsCurrent.reduce((s, l) => s + getLeadValue(l), 0) / wonLeadsCurrent.length : 0;
    
    // LTV/CAC: Assuming average ticket is the contract value, LTV is roughly that value (or renewable). 
    // If ticket is monthly, we multiply by duration. Since getLeadValue already does that (TCV), 
    // we can assume TCV is the "Initial LTV".
    const ltvCacRatio = cac > 0 ? avgTicketTotal / cac : 0;

    const leadToSaleConversion = { current: leadsFromMetaAdsInPeriod.length > 0 ? (salesFromMetaAdsInPeriod.length / leadsFromMetaAdsInPeriod.length) * 100 : 0, previous: previousPeriodCrmData.filter(l => l.source === 'Meta Ads').length > 0 ? (salesFromMetaAdsPrevPeriod.length / previousPeriodCrmData.filter(l => l.source === 'Meta Ads').length) * 100 : 0, change: 0, diff: 0 };
    leadToSaleConversion.diff = leadToSaleConversion.current - leadToSaleConversion.previous;
    leadToSaleConversion.change = calculateChange(leadToSaleConversion.current, leadToSaleConversion.previous);

    const avgTimeToSale = salesFromMetaAdsInPeriod.length > 0 ? salesFromMetaAdsInPeriod.reduce((s, l) => s + diffInDays(l.dataFechamento!, l.dataCriacao), 0) / salesFromMetaAdsInPeriod.length : 0;

    const sortedCampaigns = [...detailedCampaigns].sort((a, b) => {
        const roiA = a.roi; const roiB = b.roi;
        if (isFinite(roiA) && isFinite(roiB)) { return roiB - roiA; }
        if (!isFinite(roiA) && roiA > 0) { return -1; }
        if (!isFinite(roiB) && roiB > 0) { return 1; }
        return roiB - roiA;
    });

    return { investment, leads, cpl, roi: roi, wonValue: totalWonValue, cac, ltvCacRatio, leadToSaleConversion, avgTimeToSale, salesCount: salesFromMetaAdsInPeriod.length, metaAdsLeadsCount: leadsFromMetaAdsInPeriod.length, bestCampaign: sortedCampaigns[0] || null, topCampaignsByInvestment: [...detailedCampaigns].sort((a, b) => b.investment - a.investment).slice(0, 5), roiBubbleData: detailedCampaigns.filter(c => c.investment > 0 && c.leads > 0).map(c => ({ x: c.cpl, y: c.conversionRate, r: c.wonValue > 0 ? Math.max(5, c.wonValue / 100) : 5, name: c.name, roi: c.roi, sales: c.sales, investment: c.investment })), detailedCampaigns: detailedCampaigns.sort((a,b) => b.investment - a.investment), evolutionData: { labels: [], investment: [], leads: [], sales: [] } };
};