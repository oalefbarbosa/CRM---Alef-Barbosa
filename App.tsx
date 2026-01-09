
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CrmData, CampaignData, CrmKpis, CampaignKpis, ComparativeKpis } from './types';
import { loadCRM, loadCampanhas } from './services/dataService';
import { calculateCrmKpis, calculateCampaignKpis, calculateComparativeKpis } from './utils/calculations';
import Header from './components/Header';
import ComparativeKpiCard from './components/ComparativeKpiCard';
import ChartCard from './components/ChartCard';
import SalesFunnelChart from './components/charts/SalesFunnelChart';
import StatusDistributionChart from './components/charts/StatusDistributionChart';
import LossReasonChart from './components/charts/LossReasonChart';
import ValueFunnelChart from './components/charts/ValueFunnelChart';
import LeadsByBusinessChart from './components/charts/LeadsByBusinessChart';
import MonthlyLeadsChart from './components/charts/MonthlyLeadsChart';
import CampaignPerformanceChart from './components/charts/CampaignPerformanceChart';
import CplByCampaignChart from './components/charts/CplByCampaignChart';
import AvgTimeInStageChart from './components/charts/AvgTimeInStageChart';
import ConversionRateFunnel from './components/charts/ConversionRateFunnel';
import LeadsTable from './components/tables/LeadsTable';
import Tabs from './components/Tabs';
import * as Icons from './components/Icons';
import { CrmSummary } from './components/CrmSummary';
import { FunnelSnapshot } from './components/FunnelSnapshot';
import { CampaignsSummary } from './components/CampaignsSummary';
import { DashboardSkeletons } from './components/DashboardSkeletons';
import FilterMenu from './components/FilterMenu';


const App: React.FC = () => {
  const [crmData, setCrmData] = useState<CrmData[]>([]);
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard Geral');
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = now;
    return { startDate, endDate };
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [crmResult, campaignResult] = await Promise.all([loadCRM(), loadCampanhas()]);
      setCrmData(crmResult);
      setCampaignData(campaignResult);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Falha ao carregar os dados. Verifique as planilhas e sua conexão.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = useCallback((newRange: { startDate: Date | null; endDate: Date | null }) => {
    setDateRange(newRange);
  }, []);

  const filteredCrmData = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return crmData;
    
    const inclusiveEndDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
    if (inclusiveEndDate) inclusiveEndDate.setHours(23, 59, 59, 999);

    return crmData.filter(lead => {
        const leadDate = lead.dataCriacao;
        const startMatch = !dateRange.startDate || leadDate >= dateRange.startDate;
        const endMatch = !inclusiveEndDate || leadDate <= inclusiveEndDate;
        return startMatch && endMatch;
    });
  }, [crmData, dateRange]);

  const filteredCampaignData = useMemo(() => {
    if (!dateRange.startDate && !dateRange.endDate) return campaignData;
    
    const inclusiveEndDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
    if (inclusiveEndDate) inclusiveEndDate.setHours(23, 59, 59, 999);

    return campaignData.filter(campaign => {
        const campaignDate = campaign.dataInicio;
        const startMatch = !dateRange.startDate || campaignDate >= dateRange.startDate;
        const endMatch = !inclusiveEndDate || campaignDate <= inclusiveEndDate;
        return startMatch && endMatch;
    });
  }, [campaignData, dateRange]);

  const crmKpis: CrmKpis | null = useMemo(() => loading ? null : calculateCrmKpis(filteredCrmData), [filteredCrmData, loading]);
  const campaignKpis: CampaignKpis | null = useMemo(() => loading ? null : calculateCampaignKpis(filteredCampaignData, crmKpis), [filteredCampaignData, crmKpis, loading]);
  const comparativeKpis: ComparativeKpis | null = useMemo(() => loading ? null : calculateComparativeKpis(crmData, dateRange.startDate, dateRange.endDate), [crmData, dateRange, loading]);

  if (error) {
    return (
      <div className="min-h-screen bg-background text-text-main flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 rounded-xl border border-border text-center">
          <Icons.AlertTriangle className="mx-auto h-12 w-12 text-brand-red mb-4" />
          <h2 className="text-2xl font-bold mb-2">Ocorreu um Erro</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="bg-brand-blue text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-500 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const tabContent = {
    'Dashboard Geral': (
        loading || !crmKpis || !campaignKpis || !comparativeKpis ? <DashboardSkeletons /> :
        <div className="space-y-8">
            <section>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ComparativeKpiCard title="Leads no período" data={comparativeKpis.leads} format="number" />
                    <ComparativeKpiCard title="Taxa Conversão no período" data={comparativeKpis.conversionRate} format="percent" />
                    <ComparativeKpiCard title="Pipeline no período" data={comparativeKpis.pipeline} format="currency" />
                </div>
            </section>
            
            <CrmSummary kpis={crmKpis} data={filteredCrmData} />
            <FunnelSnapshot data={filteredCrmData} />
            <CampaignsSummary campaignKpis={campaignKpis} crmKpis={crmKpis} campaignData={filteredCampaignData} />

        </div>
    ),
    'Análise Temporal': (
        <div className="space-y-8">
            <section>
                <div className="grid grid-cols-1 gap-6">
                    <ChartCard title="Entrada de Leads Mensal" loading={loading} contentClassName="h-96"><MonthlyLeadsChart data={filteredCrmData} /></ChartCard>
                </div>
            </section>
        </div>
    ),
    'Funil e Conversão': (
        <div className="space-y-8">
            <section>
                <ChartCard title="Funil de Conversão Detalhado" loading={loading} contentClassName="h-auto">
                    <ConversionRateFunnel data={filteredCrmData} />
                </ChartCard>
            </section>
            <section>
               <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 mt-8">
                  <ChartCard title="Funil de Vendas" loading={loading}><SalesFunnelChart data={filteredCrmData} /></ChartCard>
                  <ChartCard title="Distribuição de Status" loading={loading}><StatusDistributionChart data={filteredCrmData} /></ChartCard>
                  <ChartCard title="Motivos de Perda" loading={loading}><LossReasonChart data={filteredCrmData} /></ChartCard>
                  <ChartCard title="Funil com Valores (R$)" loading={loading}><ValueFunnelChart data={filteredCrmData} /></ChartCard>
                  <ChartCard title="Leads por Tipo de Negócio" loading={loading}><LeadsByBusinessChart data={filteredCrmData} /></ChartCard>
                  <ChartCard title="Tempo Médio em Cada Etapa (dias)" loading={loading}><AvgTimeInStageChart data={filteredCrmData} /></ChartCard>
               </div>
            </section>
        </div>
    ),
    'Performance de Campanhas': (
        <div className="space-y-8">
            <section>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Leads Gerados vs. Investimento" loading={loading} contentClassName="h-96"><CampaignPerformanceChart data={filteredCampaignData} /></ChartCard>
                    <ChartCard title="Custo por Lead (CPL) por Campanha" loading={loading} contentClassName="h-96"><CplByCampaignChart data={filteredCampaignData} /></ChartCard>
                </div>
            </section>
        </div>
    ),
    'Tabela de Leads': (
      <LeadsTable data={filteredCrmData} loading={loading} />
    )
  };

  return (
    <div className="min-h-screen bg-background font-sans text-text-main p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <Header 
          lastUpdated={lastUpdated} 
          onRefresh={fetchData} 
          loading={loading}
        />
        <div className="flex justify-between items-center border-b border-border">
            <Tabs
                tabs={Object.keys(tabContent)}
                activeTab={activeTab}
                onTabClick={setActiveTab}
            />
            <FilterMenu 
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={handleDateChange}
              hasActiveFilter={!!(dateRange.startDate || dateRange.endDate)}
            />
        </div>
        <main className="mt-6">
          {tabContent[activeTab as keyof typeof tabContent]}
        </main>
      </div>
    </div>
  );
};

export default App;
