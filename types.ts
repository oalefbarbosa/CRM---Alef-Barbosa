
export interface CrmData {
  id: string;
  nome: string;
  status: string;
  dataCriacao: Date;
  dataAtualizacao: Date;
  email: string;
  telefone: string;
  instagram: string;
  investimentoAds: number;
  tipoNegocio: string;
  servico: string;
  prospeccao: string;
  temperatura: 'FRIO' | 'MORNO' | 'QUENTE' | string;
  followUp: string;
  motivoPerda: string;
  valor: number;
  url: string;
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

export interface CrmKpis {
  totalLeads: number;
  activeLeads: number;
  conversionRate: number;
  wonAverageTicket: number;
  totalPipeline: number;
  wonLeads: number;
  lostLeads: number;
  lossRate: number;
  waitingAction: number;
  wonValue: number;
  lostValue: number;
}

export interface CampaignKpis {
  totalSpent: number;
  totalLeads: number;
  avgCPL: number;
  activeCampaigns: number;
  totalCampaigns: number;
  totalReach: number;
  totalImpressions: number;
  avgCTR: number;
  avgCPC: number;
  cac: number;
  roi: number;
}

export interface ComparativeKpi {
  current: number;
  previous: number;
  change: number; // as a percentage
}

export interface ComparativeKpis {
  leads: ComparativeKpi;
  conversionRate: ComparativeKpi;
  pipeline: ComparativeKpi;
}