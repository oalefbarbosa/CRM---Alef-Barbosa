
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CrmData, FunnelConfig, Projections, ScenarioSetting, ScenarioType } from '../types';
import { calculateAllProjections } from '../utils/objectiveCalculations';
import DefineGoalsView from './objectives/DefineGoalsView';
import TrackYearView from './objectives/TrackYearView';
import CurrentMonthView from './objectives/CurrentMonthView';
import Tabs from './Tabs';

// Default configuration values
const DEFAULT_FUNNEL_CONFIG: Omit<FunnelConfig, 'ano'> = {
  faturamento_anual_meta: 600000,
  ticket_medio: 2500,
  clientes_atuais: 10,
  investimento_mensal: 2000,
  cpl: 30,
  taxa_agendamento: 15,
  taxa_comparecimento: 60,
  taxa_conversao: 30,
};

const DEFAULT_SCENARIO_SETTINGS: ScenarioSetting[] = [
    { name: 'inicial', churn: 10, adicao_mensal: 5 },
    { name: 'bom', churn: 10, adicao_mensal: 7 },
    { name: 'otimo', churn: 12, adicao_mensal: 9 },
];

const ObjectivesView: React.FC<{ allCrmData: CrmData[] }> = ({ allCrmData }) => {
  const TABS = ['🎯 Definir Metas', '📅 Mês Atual', '📊 Acompanhar Ano'];
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [funnelConfig, setFunnelConfig] = useState<FunnelConfig>({ ...DEFAULT_FUNNEL_CONFIG, ano: selectedYear });
  const [scenarioSettings, setScenarioSettings] = useState<ScenarioSetting[]>(DEFAULT_SCENARIO_SETTINGS);
  const [projections, setProjections] = useState<Projections | null>(null);

  // Load config from localStorage or set defaults on year change
  useEffect(() => {
    try {
      const storedFunnel = localStorage.getItem(`funnel_config_${selectedYear}`);
      const storedScenarios = localStorage.getItem(`scenario_settings_${selectedYear}`);
      
      setFunnelConfig(storedFunnel ? JSON.parse(storedFunnel) : { ...DEFAULT_FUNNEL_CONFIG, ano: selectedYear });
      setScenarioSettings(storedScenarios ? JSON.parse(storedScenarios) : DEFAULT_SCENARIO_SETTINGS);

    } catch (error) {
      console.error("Failed to load configs from localStorage:", error);
      setFunnelConfig({ ...DEFAULT_FUNNEL_CONFIG, ano: selectedYear });
      setScenarioSettings(DEFAULT_SCENARIO_SETTINGS);
    }
  }, [selectedYear]);

  // Recalculate projections whenever configs change
  useEffect(() => {
    const newProjections = calculateAllProjections(funnelConfig, scenarioSettings);
    setProjections(newProjections);
  }, [funnelConfig, scenarioSettings]);

  const handleSaveConfig = useCallback(() => {
    try {
      localStorage.setItem(`funnel_config_${funnelConfig.ano}`, JSON.stringify(funnelConfig));
      localStorage.setItem(`scenario_settings_${funnelConfig.ano}`, JSON.stringify(scenarioSettings));
      console.log("Configuration saved!");
      // You could add a toast notification here for feedback
    } catch (error) {
      console.error("Failed to save config to localStorage:", error);
    }
  }, [funnelConfig, scenarioSettings]);
  
  const handleScenarioSettingChange = (name: ScenarioType, field: 'churn' | 'adicao_mensal', value: number) => {
    setScenarioSettings(prev => prev.map(s => s.name === name ? { ...s, [field]: value } : s));
  };


  // Calculate Realized Data from CRM
  const realizedData = useMemo(() => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1, faturamento_real: 0, vendas_real: 0, leads_real: 0, reunioes_real: 0,
    }));

    const reuniaoStatuses = ['reunião de triagem', 'reunião de proposta', 'em follow up', 'em negociação', 'ganho'];

    allCrmData.forEach(lead => {
      // Use UTC methods to prevent timezone shifts from changing the date
      const leadYear = lead.dataCriacao.getUTCFullYear();
      
      // Leads created in the selected year
      if (leadYear === selectedYear) {
        monthlyData[lead.dataCriacao.getUTCMonth()].leads_real++;
      }
      
      const updateDate = lead.dataAtualizacao;
      if (updateDate && updateDate.getUTCFullYear() === selectedYear) {
          if (reuniaoStatuses.includes(lead.status)) {
             monthlyData[updateDate.getUTCMonth()].reunioes_real++;
          }
      }

      // Vendas & Faturamento closed in the selected year
      const closeDate = lead.dataFechamento;
      if (lead.status === 'ganho' && closeDate && closeDate.getUTCFullYear() === selectedYear) {
        monthlyData[closeDate.getUTCMonth()].vendas_real++;
        monthlyData[closeDate.getUTCMonth()].faturamento_real += lead.valor;
      }
    });
    
    const clientes_real_total = new Set(
        allCrmData.filter(l => l.status === 'ganho' && l.dataFechamento && l.dataFechamento.getUTCFullYear() <= selectedYear)
                   .map(l => l.nome) 
    ).size;


    return { monthly: monthlyData, total: { clientes_real: clientes_real_total } };
  }, [allCrmData, selectedYear]);
  
  const availableYears = useMemo(() => {
      const years = new Set(allCrmData.map(d => d.dataCriacao.getFullYear()));
      const currentYear = new Date().getFullYear();
      years.add(currentYear);
      years.add(currentYear + 1); // Allow planning for next year
      return Array.from(years).sort((a,b) => Number(b) - Number(a));
  }, [allCrmData]);

  return (
    <div className="space-y-6 animate-fade-in-down">
      <div className="bg-card border border-border rounded-xl p-2 sticky top-2 z-20">
        <Tabs tabs={TABS} activeTab={activeTab} onTabClick={setActiveTab} />
      </div>

      {projections && (
        <>
          {activeTab === TABS[0] && (
            <DefineGoalsView 
              funnelConfig={funnelConfig}
              setFunnelConfig={setFunnelConfig}
              scenarioSettings={scenarioSettings}
              onScenarioSettingChange={handleScenarioSettingChange}
              onSave={handleSaveConfig}
              projections={projections}
              availableYears={availableYears}
              onYearChange={setSelectedYear}
            />
          )}
          
          {activeTab === TABS[1] && (
            <CurrentMonthView
              funnelConfig={funnelConfig}
              realizedData={realizedData.monthly}
              projections={projections}
            />
          )}

          {activeTab === TABS[2] && (
            <TrackYearView 
                funnelConfig={funnelConfig}
                projections={projections}
                realized={realizedData}
                selectedYear={selectedYear}
                availableYears={availableYears}
                onYearChange={setSelectedYear}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ObjectivesView;