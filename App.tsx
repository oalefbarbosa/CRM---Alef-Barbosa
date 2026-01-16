
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CrmData, CampaignData, DashboardGeralMetrics } from './types';
import { loadCRM, loadCampanhas } from './services/dataService';
import { calculateDashboardGeralMetrics } from './utils/calculations';
import Header from './components/Header';
import * as Icons from './components/Icons';
import { DashboardSkeletons } from './components/DashboardSkeletons';
import DashboardGeralView from './components/DashboardGeralView';


const App: React.FC = () => {
  const [crmData, setCrmData] = useState<CrmData[]>([]);
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [dateRange, setDateRange] = useState<{startDate: Date | null, endDate: Date | null}>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  });

  const [filters, setFilters] = useState<{ tipoNegocio: string[], source: string[], status: string[] }>({
    tipoNegocio: [],
    source: [],
    status: [],
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

  const handleFilterChange = useCallback((filterType: keyof typeof filters, selectedOptions: string[]) => {
    setFilters(prev => ({ ...prev, [filterType]: selectedOptions }));
  }, []);

  const { uniqueTipoNegocio, uniqueSource, uniqueStatus } = useMemo(() => {
    const tipoNegocioSet = new Set<string>();
    const sourceSet = new Set<string>();
    const statusSet = new Set<string>();
    crmData.forEach(d => {
      if (d.tipoNegocio && d.tipoNegocio !== 'N/A') tipoNegocioSet.add(d.tipoNegocio);
      if (d.source && d.source !== 'N/A') sourceSet.add(d.source);
      if (d.status) statusSet.add(d.status);
    });
    return {
      uniqueTipoNegocio: Array.from(tipoNegocioSet).sort(),
      uniqueSource: Array.from(sourceSet).sort(),
      uniqueStatus: Array.from(statusSet).sort(),
    };
  }, [crmData]);


  const filteredCrmData = useMemo(() => {
    let data = crmData;

    // Date filter
    if (dateRange.startDate && dateRange.endDate) {
        const inclusiveEndDate = new Date(dateRange.endDate);
        inclusiveEndDate.setHours(23, 59, 59, 999);
        data = data.filter(lead => {
            const leadDate = lead.dataCriacao;
            return leadDate >= dateRange.startDate! && leadDate <= inclusiveEndDate;
        });
    }

    // Text filters
    if (filters.tipoNegocio.length > 0) {
        data = data.filter(lead => filters.tipoNegocio.includes(lead.tipoNegocio));
    }
    if (filters.source.length > 0) {
        data = data.filter(lead => filters.source.includes(lead.source));
    }
    if (filters.status.length > 0) {
        data = data.filter(lead => filters.status.includes(lead.status));
    }

    return data;
  }, [crmData, dateRange, filters]);

  const filteredCampaignData = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return campaignData;
    const inclusiveEndDate = new Date(dateRange.endDate);
    inclusiveEndDate.setHours(23, 59, 59, 999);
    return campaignData.filter(campaign => {
        const campaignDate = campaign.dataInicio;
        return campaignDate >= dateRange.startDate! && campaignDate <= inclusiveEndDate;
    });
  }, [campaignData, dateRange]);

  const dashboardGeralMetrics: DashboardGeralMetrics | null = useMemo(() => 
    loading ? null : calculateDashboardGeralMetrics(filteredCrmData, crmData, filteredCampaignData, campaignData, dateRange),
  [filteredCrmData, crmData, filteredCampaignData, campaignData, dateRange, loading]);
  
  const hasActiveNonDateFilter = filters.tipoNegocio.length > 0 || filters.source.length > 0 || filters.status.length > 0;

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

  return (
    <div className="min-h-screen bg-background font-sans text-text-main p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <Header 
          lastUpdated={lastUpdated} 
          onRefresh={fetchData} 
          loading={loading}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onDateChange={handleDateChange}
          hasActiveFilter={!!(dateRange.startDate || dateRange.endDate) || hasActiveNonDateFilter}
          filters={filters}
          onFilterChange={handleFilterChange}
          filterOptions={{
            tipoNegocio: uniqueTipoNegocio,
            source: uniqueSource,
            status: uniqueStatus,
          }}
        />
        <main>
          {loading || !dashboardGeralMetrics 
            ? <DashboardSkeletons /> 
            : <DashboardGeralView data={dashboardGeralMetrics} crmData={filteredCrmData} />
          }
        </main>
      </div>
    </div>
  );
};

export default App;