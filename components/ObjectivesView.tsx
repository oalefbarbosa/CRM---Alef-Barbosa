
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CrmData, FunnelConfig, Projections } from '../types';
import { calculateAllProjections } from '../utils/objectiveCalculations';
import DefineGoalsView from './objectives/DefineGoalsView';
import TrackPerformanceView from './objectives/TrackPerformanceView';
import Tabs from './Tabs';

// Default configuration values
const DEFAULT_CONFIG: Omit<FunnelConfig, 'ano'> = {
  faturamento_anual_meta: 600000,
  ticket_medio: 2500,
  clientes_atuais: 10,
  investimento_mensal: 2000,
  cpl: 30,
  taxa_agendamento: 15,
  taxa_comparecimento: 60,
  taxa_conversao: 30,
};

const ObjectivesView: React.FC<{ allCrmData: CrmData[] }> = ({ allCrmData }) => {
  const [activeTab, setActiveTab] = useState('Definir Metas');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [config, setConfig] = useState<FunnelConfig>({ ...DEFAULT_CONFIG, ano: selectedYear });
  const [projections, setProjections] = useState<Projections | null>(null);

  // Load config from localStorage or set defaults on year change
  useEffect(() => {
    try {
      const storedConfig = localStorage.getItem(`metas_config_${selectedYear}`);
      const initialConfig = storedConfig ? JSON.parse(storedConfig) : { ...DEFAULT_CONFIG, ano: selectedYear };
      setConfig(initialConfig);
    } catch (error) {
      console.error("Failed to load config from localStorage:", error);
      setConfig({ ...DEFAULT_CONFIG, ano: selectedYear });
    }
  }, [selectedYear]);

  // Recalculate projections whenever config changes
  useEffect(() => {
    const newProjections = calculateAllProjections(config);
    setProjections(newProjections);
  }, [config]);

  const handleSaveConfig = useCallback((newConfig: FunnelConfig) => {
    try {
      localStorage.setItem(`metas_config_${newConfig.ano}`, JSON.stringify(newConfig));
      // You could add a toast notification here for feedback
      console.log("Configuration saved!");
    } catch (error) {
      console.error("Failed to save config to localStorage:", error);
    }
  }, []);

  // Calculate Realized Data from CRM
  const realizedData = useMemo(() => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      faturamento_real: 0,
      vendas_real: 0,
      leads_real: 0,
      agendamentos_real: 0, // Placeholder for future logic if needed
      reunioes_real: 0, // Placeholder
    }));

    allCrmData.forEach(lead => {
      if (lead.dataCriacao.getFullYear() === selectedYear) {
        const monthIndex = lead.dataCriacao.getMonth();
        monthlyData[monthIndex].leads_real++;
      }

      if (lead.status === 'ganho' && lead.dataFechamento && lead.dataFechamento.getFullYear() === selectedYear) {
        const monthIndex = lead.dataFechamento.getMonth();
        monthlyData[monthIndex].vendas_real++;
        monthlyData[monthIndex].faturamento_real += lead.valor;
      }
    });
    
    // Active clients are a snapshot in time, not monthly, so we calculate it as a total
    const clientes_real_total = new Set(
        allCrmData
            .filter(l => l.status === 'ganho' && l.dataFechamento && l.dataFechamento.getFullYear() <= selectedYear)
            .map(l => l.nome) // Simplistic assumption; a real system might use client IDs
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
      <div className="bg-card border border-border rounded-xl p-2">
        <Tabs 
            tabs={['🎯 Definir Metas', '📊 Acompanhar Realizado']} 
            activeTab={activeTab === 'Definir Metas' ? '🎯 Definir Metas' : '📊 Acompanhar Realizado'}
            onTabClick={(tab) => setActiveTab(tab.includes('Definir') ? 'Definir Metas' : 'Acompanhar Realizado')}
        />
      </div>

      {activeTab === 'Definir Metas' && projections && (
        <DefineGoalsView 
          config={config}
          setConfig={setConfig}
          onSave={handleSaveConfig}
          projections={projections}
          availableYears={availableYears}
          onYearChange={setSelectedYear}
        />
      )}
      
      {activeTab === 'Acompanhar Realizado' && projections && (
        <TrackPerformanceView 
            config={config}
            projections={projections}
            realized={realizedData}
            selectedYear={selectedYear}
            availableYears={availableYears}
            onYearChange={setSelectedYear}
        />
      )}
    </div>
  );
};

export default ObjectivesView;
