
export interface CrmData {
  id: string;
  nome: string;
  status: string; // leads, em prospecção, reunião de triagem, etc.
  dataCriacao: Date;
  dataAtualizacao: Date;
  dataFechamento: Date | null;
  responsavel: string;
  email: string;
  telefone: string;
  instagram: string;
  investimentoAds: number;
  tipoNegocio: string;
  servico: string;
  prospeccao: string; // Não abordado, Tentativa 1, ... Última Tentativa, Perdido
  temperatura: 'FRIO' | 'MORNO' | 'QUENTE' | string;
  followUp: string; // Proposta Enviada, Fup 1, ... Último Fup, Perdido
  motivoPerda: string;
  valor: number;
  url: string;
  source: string; // Meta Ads, indicação, etc.
  campaign: string;
}

export interface CampaignData {
  dataInicio: Date;
  nome: string;
  tipo: string;
  nicho: string;
  status: string;
  valorUsado: number;
  orcamento: number;
  alcance: number;
  frequencia: number;
  impressoes: number;
  cpm: number;
  cliques: number;
  cpc: number;
  ctr: number;
  conversas: number;
  custoConversa: number;
  leads: number;
  custoLead: number;
  leadFormulario: number;
  roas: number;
}

export interface CampaignKpis {
  avgCPL: number;
  avgCTR: number;
  roi: number;
  totalSpent: number;
  totalCampaigns: number;
  totalLeads: number;
  totalReach: number;
  totalImpressions: number;
  avgCPC: number;
}

export interface CrmKpis {
  activeLeads: number;
  lostLeads: number;
  wonLeads: number;
  totalLeads: number;
  conversionRate: number;
  totalPipeline: number;
  wonValue: number;
  lostValue: number;
  lossRate: number;
}

export interface ComparativeKpi {
  current: number;
  previous: number;
  change: number; 
}

export interface ComparativeKpiPoints extends ComparativeKpi {
    diff: number;
}

// --- NEW DASHBOARD TYPES ---

export interface FunnelStage {
    name: string;
    count: number;
    value: number;
    subStages?: { name: string; count: number; isRisk?: boolean }[];
}

export interface FunnelConversion {
    from: string;
    to: string;
    fromCount: number;
    toCount: number;
    rate: number;
}

export interface Alert {
    type: 'critical' | 'bottleneck' | 'opportunity';
    title: string;
    message: string;
    details?: string[];
    valueAtRisk?: number;
}

export interface ProspectingAnalysis {
    totalInStage: number;
    distribution: { name: string; count: number; percentage: number }[];
    successRate: { attempt: string; rate: number }[]; // Placeholder for now
    atRisk: {
        notApproached: number;
        lastAttempt: number;
        total: number;
        value: number;
    };
}

export interface FollowUpAnalysis {
    totalInStage: number;
    distribution: { name: string; count: number }[];
    closingPerformance: { step: string; rate: number }[]; // Placeholder for now
    avgTimeInFollowUp: number;
    urgent: {
        lastFup: { count: number; value: number; };
        stale7days: number;
        stale14days: number;
    };
}

export interface FunnelVelocity {
    avgTimeToStage: { stage: string; days: number }[]; // Placeholder for now
    avgTotalCycleTime: number;
    staleLeads: {
        '7_days': number;
        '14_days': number;
        '30_days': number;
    };
    byResponsible: { name: string; avgDays: number }[];
    salesByDayOfWeek: { labels: string[], data: number[] };
}

export interface CampaignPerformanceData {
    name: string;
    investment: number;
    leads: number;
    sales: number;
    wonValue: number;
    roi: number;
    cpl: number;
    conversionRate: number;
    avgTimeToSale?: number;
    topResponsible?: string;
    impressions?: number;
    clicks?: number;
    ctr?: number;
    cpm?: number;
    cpc?: number;
}

export interface CampaignAnalysis {
    investment: ComparativeKpi;
    leads: ComparativeKpi;
    cpl: ComparativeKpi;
    roi: number;
    wonValue: number;
    salesCount: number;
    cac: number;
    ltvCacRatio: number;
    avgTimeToSale: number;
    leadToSaleConversion: ComparativeKpiPoints;
    metaAdsLeadsCount: number;
    bestCampaign: CampaignPerformanceData | null;
    topCampaignsByInvestment: CampaignPerformanceData[];
    roiBubbleData: {
        x: number; // CPL
        y: number; // Conversion Rate
        r: number; // Won Value
        name: string;
        roi: number;
        sales: number;
        investment: number;
    }[];
    detailedCampaigns: CampaignPerformanceData[];
    evolutionData: {
        labels: string[];
        investment: number[];
        leads: number[];
        sales: number[];
    };
}

export interface ResponsibleData {
    name: string;
    totalLeads: number;
    sales: number;
    conversionRate: number;
    totalValue: number;
    avgTicket: number;
    avgTimeToClose: number;
    score: number;
}
export interface ResponsibleAnalysis {
    ranking: ResponsibleData[];
    performanceChart: { labels: string[], sales: number[], values: number[] };
    detailed: ResponsibleData[];
}

export interface ForecastLead {
    name: string;
    status: string;
    value: number;
    probability: number;
    daysInStage: number;
    responsible: string;
}
export interface ForecastAnalysis {
    next7Days: {
        sales: { min: number, max: number };
        value: { min: number, max: number };
    };
    leads: ForecastLead[];
}

export interface TimeFunnelAnalysis {
    stages: { name: string, days: number }[];
    total: number;
    bottleneck: string | null;
}

export interface StageKpi {
    count: number;
    value: number;
    conversion: number;
}

export interface DashboardGeralMetrics {
    // Top KPIs
    totalLeadsKpi: { count: number; value: number; conversionToNext: number; };
    newLeadsTodayKpi: { count: number; value: number; };
    activeLeadsKpi: { count: number; value: number; };
    prospeccaoKpi: StageKpi;
    propostaKpi: StageKpi;
    followUpKpi: StageKpi;
    negociacaoKpi: StageKpi;
    geralConversion: { rate: ComparativeKpiPoints; sales: number; totalLeads: number; };
    closedSales: { count: ComparativeKpi; value: ComparativeKpi; avgTicket: ComparativeKpi; conversion: number; lastSale: { daysAgo: number, value: number } | null };
    lostLeads: { count: ComparativeKpi; value: number; avgValue: number; topReasons: { reason: string; count: number }[] };

    // Alert
    alert: Alert | null;

    // Deep Dives
    prospecting: ProspectingAnalysis;
    followUp: FollowUpAnalysis;
    campaigns: CampaignAnalysis;
    byResponsible: ResponsibleAnalysis;
    forecast: ForecastAnalysis;
    timeFunnel: TimeFunnelAnalysis;
    
    // Funnel & Velocity
    visualFunnel: { stages: FunnelStage[]; conversions: FunnelConversion[]; bottleneck: FunnelConversion | null; opportunity: FunnelConversion | null; };
    velocity: FunnelVelocity;
}