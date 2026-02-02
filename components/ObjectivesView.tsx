
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CrmData, FunnelConfig, Projections, ScenarioSetting, ScenarioType } from '../types';
import { calculateAllProjections } from '../utils/objectiveCalculations';
import { loadConfig, saveConfig, ConfigMap } from '../services/configService';
import DefineGoalsView from './objectives/DefineGoalsView';
import TrackYearView from './objectives/TrackYearView';
import CurrentMonthView from './objectives/CurrentMonthView';
import Tabs from './Tabs';
import * as Icons from './Icons';

// Default configuration values
const DEFAULT_FUNNEL_CONFIG: Omit<FunnelConfig, 'ano'> = {
  faturamento_anual_meta: 400000,
  ticket_medio: 1497,
  duracao_contrato_meses: 12,
  clientes_atuais: 5,
  investimento_mensal: 1000,
  cpl: 30,
  taxa_agendamento: 50,
  taxa_comparecimento: 50,
  taxa_conversao: 50,
};

const DEFAULT_SCENARIO_SETTINGS: ScenarioSetting[] = [
    { name: 'inicial', churn: 10, adicao_mensal: 5 },
    { name: 'bom', churn: 10, adicao_mensal: 7 },
    { name: 'otimo', churn: 12, adicao_mensal: 9 },
];

type SavingStatus = 'idle' | 'saving' | 'saved' | 'error';

const ObjectivesView: React.FC<{ allCrmData: CrmData[] }> = ({ allCrmData }) => {
  const TABS = ['🎯 Definir Metas', '📅 Mês Atual', '📊 Acompanhar Ano'];
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [selectedYear, setSelectedYear] = useState(new Date().getUTCFullYear());
  
  // Local state for UI
  const [funnelConfig, setFunnelConfig] = useState<FunnelConfig>({ ...DEFAULT_FUNNEL_CONFIG, ano: selectedYear });
  const [scenarioSettings, setScenarioSettings] = useState<ScenarioSetting[]>(DEFAULT_SCENARIO_SETTINGS);
  const [projections, setProjections] = useState<Projections | null>(null);

  // State for data from Google Sheet
  const [allConfigs, setAllConfigs] = useState<ConfigMap>(new Map());
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [savingStatus, setSavingStatus] = useState<SavingStatus>('idle');


  // 1. Load all configs from Google Sheet on initial mount
  useEffect(() => {
    const fetchConfig = async () => {
      setIsLoadingConfig(true);
      try {
        const configs = await loadConfig();
        setAllConfigs(configs);
      } catch (error) {
        console.error("Failed to load configs from Google Sheet:", error);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // 2. Update local UI state when year changes or after configs are loaded
  useEffect(() => {
    if (isLoadingConfig) return; // Wait until configs are loaded
    
    const funnelKey = `funnel_config_${selectedYear}`;
    const scenariosKey = `scenario_settings_${selectedYear}`;

    const storedFunnel = allConfigs.get(funnelKey) as FunnelConfig;
    const storedScenarios = allConfigs.get(scenariosKey) as ScenarioSetting[];
    
    setFunnelConfig(storedFunnel || { ...DEFAULT_FUNNEL_CONFIG, ano: selectedYear });
    setScenarioSettings(storedScenarios || DEFAULT_SCENARIO_SETTINGS);

  }, [selectedYear, allConfigs, isLoadingConfig]);

  // 3. Recalculate projections whenever local configs change
  useEffect(() => {
    const newProjections = calculateAllProjections(funnelConfig, scenarioSettings);
    setProjections(newProjections);
  }, [funnelConfig, scenarioSettings]);

  // 4. Auto-save configuration to Google Sheet with a debounce
  useEffect(() => {
    if (isLoadingConfig || !projections) { // Don't save on initial load or before calculations
        return;
    }

    const handler = setTimeout(async () => {
        setSavingStatus('saving');
        try {
            const funnelKey = `funnel_config_${funnelConfig.ano}`;
            const scenariosKey = `scenario_settings_${funnelConfig.ano}`;
            
            await Promise.all([
                saveConfig(funnelKey, funnelConfig),
                saveConfig(scenariosKey, scenarioSettings)
            ]);
            
            setSavingStatus('saved');
            setTimeout(() => setSavingStatus('idle'), 2000); // Reset after 2s
        } catch (error) {
            console.error("Failed to auto-save config to Google Sheet:", error);
            setSavingStatus('error');
        }
    }, 1500); // Debounce for 1.5 seconds

    return () => {
        clearTimeout(handler); // Cleanup on component unmount or if config changes again
    };
  }, [funnelConfig, scenarioSettings, isLoadingConfig, projections]);
  
  const handleScenarioSettingChange = (name: ScenarioType, field: 'churn' | 'adicao_mensal', value: number) => {
    setScenarioSettings(prev => prev.map(s => s.name === name ? { ...s, [field]: value } : s));
  };


  // Calculate Realized Data from CRM (no change here)
  const realizedData = useMemo(() => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1, faturamento_real: 0, vendas_real: 0, leads_real: 0, reunioes_real: 0,
    }));

    const reuniaoStatuses = ['reunião de triagem', 'reunião de proposta', 'em follow up', 'em negociação', 'ganho', 'venda'];
    const WON_STATUSES = ['ganho', 'venda'];

    allCrmData.forEach(lead => {
      const leadYear = lead.dataCriacao.getUTCFullYear();
      if (leadYear === selectedYear) {
        monthlyData[lead.dataCriacao.getUTCMonth()].leads_real++;
      }
      
      const updateDate = lead.dataAtualizacao;
      if (updateDate && updateDate.getUTCFullYear() === selectedYear) {
          if (reuniaoStatuses.includes(lead.status)) {
             monthlyData[updateDate.getUTCMonth()].reunioes_real++;
          }
      }

      const closeDate = lead.dataFechamento;
      if (WON_STATUSES.includes(lead.status) && closeDate && closeDate.getUTCFullYear() === selectedYear) {
        monthlyData[closeDate.getUTCMonth()].vendas_real++;
        monthlyData[closeDate.getUTCMonth()].faturamento_real += lead.valor;
      }
    });
    
    const clientes_real_total = new Set(
        allCrmData.filter(l => WON_STATUSES.includes(l.status) && l.dataFechamento && l.dataFechamento.getUTCFullYear() <= selectedYear)
                   .map(l => l.nome) 
    ).size;


    return { monthly: monthlyData, total: { clientes_real: clientes_real_total } };
  }, [allCrmData, selectedYear]);
  
  const availableYears = useMemo(() => {
      const years = new Set(allCrmData.map(d => d.dataCriacao.getUTCFullYear()));
      const currentYear = new Date().getUTCFullYear();
      years.add(currentYear);
      years.add(currentYear + 1);
      return Array.from(years).sort((a,b) => Number(b) - Number(a));
  }, [allCrmData]);

  const SavingIndicator = () => {
    const statusMap = {
        saving: { text: 'Salvando...', icon: <Icons.RefreshCw className="w-4 h-4 animate-spin"/>, color: 'text-text-secondary' },
        saved: { text: 'Salvo na nuvem!', icon: <Icons.CheckCircle className="w-4 h-4"/>, color: 'text-brand-green' },
        error: { text: 'Erro ao salvar!', icon: <Icons.AlertTriangle className="w-4 h-4"/>, color: 'text-brand-red' },
        idle: { text: '', icon: null, color: ''}
    }
    const currentStatus = statusMap[savingStatus];
    if (savingStatus === 'idle') return null;

    return <p className={`text-xs italic flex items-center justify-end gap-2 transition-all ${currentStatus.color}`}>{currentStatus.icon} {currentStatus.text}</p>
  }

  return (
    <div className="space-y-6 animate-fade-in-down">
      <div className="bg-card border border-border rounded-xl p-2 sticky top-2 z-20 flex justify-between items-center">
        <Tabs tabs={TABS} activeTab={activeTab} onTabClick={setActiveTab} />
        <div className="pr-4">
            <SavingIndicator />
        </div>
      </div>

      {(isLoadingConfig || !projections) ? (
          <div className="text-center p-12 text-text-secondary">
              <Icons.RefreshCw className="h-8 w-8 mx-auto animate-spin mb-4" />
              Carregando configurações...
          </div>
      ) : (
        <>
          {activeTab === TABS[0] && (
            <DefineGoalsView 
              funnelConfig={funnelConfig}
              setFunnelConfig={setFunnelConfig}
              scenarioSettings={scenarioSettings}
              onScenarioSettingChange={handleScenarioSettingChange}
              projections={projections}
              availableYears={availableYears}
              onYearChange={setSelectedYear}
              savingStatus={savingStatus}
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