
import { CrmData, CampaignData, CrmKpis, CampaignKpis, ComparativeKpis } from '../types';

export const calculateCrmKpis = (data: CrmData[]): CrmKpis => {
  const totalLeads = data.length;
  if (totalLeads === 0) {
    return {
      totalLeads: 0, activeLeads: 0, conversionRate: 0,
      wonAverageTicket: 0, totalPipeline: 0, wonLeads: 0, lostLeads: 0,
      lossRate: 0, waitingAction: 0, wonValue: 0, lostValue: 0,
    };
  }

  const stats = data.reduce((acc, lead) => {
    if (lead.status === 'ganho') {
      acc.wonLeads += 1;
      acc.wonValue += lead.valor;
    } else if (lead.status === 'perdido') {
      acc.lostLeads += 1;
      acc.lostValue += lead.valor;
    } else {
      // Any other status is considered active for pipeline calculation
      acc.activeLeads += 1;
      acc.totalPipeline += lead.valor;
    }

    if (lead.prospeccao === 'Não abordado' || !lead.prospeccao) {
      acc.waitingAction += 1;
    }

    return acc;
  }, {
    wonLeads: 0, lostLeads: 0, activeLeads: 0,
    wonValue: 0, lostValue: 0, totalPipeline: 0,
    waitingAction: 0,
  });

  const totalClosed = stats.wonLeads + stats.lostLeads;
  const conversionRate = totalClosed > 0 ? (stats.wonLeads / totalClosed) * 100 : 0;
  const lossRate = totalClosed > 0 ? (stats.lostLeads / totalClosed) * 100 : 0;
  const wonAverageTicket = stats.wonLeads > 0 ? stats.wonValue / stats.wonLeads : 0;

  return {
    totalLeads,
    activeLeads: stats.activeLeads,
    conversionRate,
    wonAverageTicket,
    totalPipeline: stats.totalPipeline,
    wonLeads: stats.wonLeads,
    lostLeads: stats.lostLeads,
    lossRate,
    waitingAction: stats.waitingAction,
    wonValue: stats.wonValue,
    lostValue: stats.lostValue,
  };
};

export const calculateCampaignKpis = (data: CampaignData[], crmKpis: CrmKpis | null): CampaignKpis => {
    if (data.length === 0) {
        return {
            totalSpent: 0, totalLeads: 0, avgCPL: 0, activeCampaigns: 0, totalCampaigns: 0,
            totalReach: 0, totalImpressions: 0, avgCTR: 0, avgCPC: 0,
            cac: 0, roi: 0,
        };
    }

    const uniqueCampaigns = new Map<string, { isActive: boolean }>();

    const stats = data.reduce((acc, item) => {
        acc.totalSpent += item.valorUsado;
        acc.totalLeads += item.leads + item.leadFormulario;
        acc.totalReach += item.alcance;
        acc.totalImpressions += item.impressoes;
        acc.totalClicks += item.cliques;

        // Group campaigns by name and check if any of their entries is 'active'
        if (!uniqueCampaigns.has(item.nome)) {
            uniqueCampaigns.set(item.nome, { isActive: false });
        }
        if (item.status === 'ativa') { // status is now lowercase 'ativa' from dataService
            uniqueCampaigns.get(item.nome)!.isActive = true;
        }
        
        return acc;
    }, {
        totalSpent: 0,
        totalLeads: 0,
        totalReach: 0,
        totalImpressions: 0,
        totalClicks: 0,
    });

    const totalCampaigns = uniqueCampaigns.size;
    const activeCampaigns = Array.from(uniqueCampaigns.values()).filter(c => c.isActive).length;
    
    const avgCPL = stats.totalLeads > 0 ? stats.totalSpent / stats.totalLeads : 0;
    const avgCTR = stats.totalImpressions > 0 ? (stats.totalClicks / stats.totalImpressions) * 100 : 0;
    const avgCPC = stats.totalClicks > 0 ? stats.totalSpent / stats.totalClicks : 0;

    const cac = crmKpis && crmKpis.wonLeads > 0 ? stats.totalSpent / crmKpis.wonLeads : 0;
    const roi = crmKpis && stats.totalSpent > 0 ? ((crmKpis.wonValue - stats.totalSpent) / stats.totalSpent) * 100 : 0;
    
    return {
        totalSpent: stats.totalSpent,
        totalLeads: stats.totalLeads,
        avgCPL,
        activeCampaigns,
        totalCampaigns,
        totalReach: stats.totalReach,
        totalImpressions: stats.totalImpressions,
        avgCTR,
        avgCPC,
        cac,
        roi
    };
};

const getMonthYear = (d: Date) => d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);

const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) {
        return current > 0 ? Infinity : 0;
    }
    return ((current - previous) / previous) * 100;
};

const calculateMetricsForPeriod = (periodData: CrmData[]) => {
    const wonLeads = periodData.filter(d => d.status === 'ganho').length;
    const lostLeads = periodData.filter(d => d.status === 'perdido').length;
    const totalClosed = wonLeads + lostLeads;
    const conversionRate = totalClosed > 0 ? (wonLeads / totalClosed) * 100 : 0;
    const pipeline = periodData.filter(d => d.status !== 'ganho' && d.status !== 'perdido').reduce((sum, lead) => sum + lead.valor, 0);

    return {
        leads: periodData.length,
        conversionRate,
        pipeline
    };
};

export const calculateComparativeKpis = (data: CrmData[], startDate?: Date | null, endDate?: Date | null): ComparativeKpis => {
    const defaultKpi = { current: 0, previous: 0, change: 0 };
    const defaultResult = { leads: defaultKpi, conversionRate: defaultKpi, pipeline: defaultKpi };

    if (data.length === 0) return defaultResult;

    let currentMetrics, previousMetrics;

    if (startDate && endDate) {
        const inclusiveEndDate = new Date(endDate);
        inclusiveEndDate.setHours(23, 59, 59, 999);

        const duration = inclusiveEndDate.getTime() - startDate.getTime();
        const previousEndDate = new Date(startDate.getTime() - 1);
        const previousStartDate = new Date(previousEndDate.getTime() - duration);
        
        const currentPeriodData = data.filter(d => d.dataCriacao >= startDate && d.dataCriacao <= inclusiveEndDate);
        const previousPeriodData = data.filter(d => d.dataCriacao >= previousStartDate && d.dataCriacao <= previousEndDate);
        
        currentMetrics = calculateMetricsForPeriod(currentPeriodData);
        previousMetrics = calculateMetricsForPeriod(previousPeriodData);

    } else {
        const monthlyData = data.reduce((acc, lead) => {
            const month = getMonthYear(lead.dataCriacao);
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(lead);
            return acc;
        }, {} as Record<string, CrmData[]>);

        const sortedMonths = Object.keys(monthlyData).sort().reverse();
        if (sortedMonths.length === 0) return defaultResult;

        const currentMonthKey = sortedMonths[0];
        const previousMonthKey = sortedMonths[1];

        const currentMonthData = monthlyData[currentMonthKey] || [];
        const previousMonthData = previousMonthKey ? monthlyData[previousMonthKey] : [];

        currentMetrics = calculateMetricsForPeriod(currentMonthData);
        previousMetrics = calculateMetricsForPeriod(previousMonthData);
    }
    
    return {
        leads: {
            current: currentMetrics.leads,
            previous: previousMetrics.leads,
            change: calculateChange(currentMetrics.leads, previousMetrics.leads)
        },
        conversionRate: {
            current: currentMetrics.conversionRate,
            previous: previousMetrics.conversionRate,
            change: currentMetrics.conversionRate - previousMetrics.conversionRate // Direct difference for percentage points
        },
        pipeline: {
            current: currentMetrics.pipeline,
            previous: previousMetrics.pipeline,
            change: calculateChange(currentMetrics.pipeline, previousMetrics.pipeline)
        }
    };
};