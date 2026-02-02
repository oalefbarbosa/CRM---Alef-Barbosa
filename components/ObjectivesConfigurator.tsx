
import React, { useState } from 'react';
import { ObjectiveConfig, Scenario } from '../types';
import * as Icons from './Icons';

interface ObjectivesConfiguratorProps {
  config: ObjectiveConfig;
  onConfigChange: (newConfig: ObjectiveConfig) => void;
  onRecalculate: (config: ObjectiveConfig) => void;
  availableYears: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const SCENARIOS: Record<Scenario, Partial<ObjectiveConfig>> = {
    conservador: { adicao_mensal: 5, churn_meta: 10 },
    moderado: { adicao_mensal: 7, churn_meta: 10 },
    agressivo: { adicao_mensal: 9, churn_meta: 12 },
};

const DEFAULT_CONFIG: Omit<ObjectiveConfig, 'ano' | 'cenario'> = {
  ticket_medio: 1497,
  clientes_atuais: 5,
  churn_meta: 10,
  adicao_mensal: 5,
  leads_meta_base: 50,
  conversao_meta: 40,
};

const ObjectivesConfigurator: React.FC<ObjectivesConfiguratorProps> = ({ 
    config, onConfigChange, onRecalculate, availableYears, selectedYear, onYearChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, [e.target.name]: Number(e.target.value) });
  };

  const handleScenarioChange = (scenario: Scenario) => {
    onConfigChange({ ...config, ...SCENARIOS[scenario], cenario: scenario });
  };

  const handleReset = () => {
    onConfigChange({ ...config, ...DEFAULT_CONFIG, cenario: 'conservador' });
  };
  
  const handleApply = () => {
    onRecalculate(config);
    // Optional: add a toast notification here
  };

  const InputField: React.FC<{name: keyof ObjectiveConfig, label: string, type?: 'currency' | 'percent'}> = ({name, label, type}) => (
    <div>
        <label className="block text-sm font-medium text-text-secondary mb-1">{label}</label>
        <div className="relative">
            {type === 'currency' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">R$</span>}
            <input 
                type="number"
                name={name}
                value={config[name]}
                onChange={handleInputChange}
                className={`w-full bg-background border border-border rounded-lg py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono ${type === 'currency' ? 'pl-8 pr-3' : type === 'percent' ? 'pr-8 pl-3' : 'px-3'}`}
            />
            {type === 'percent' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary">%</span>}
        </div>
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm">
      <details open={isOpen} onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="p-4 cursor-pointer flex justify-between items-center list-none">
          <div className="flex items-center gap-3">
            <Icons.Target className="h-6 w-6 text-brand-blue" />
            <div>
              <h2 className="text-lg font-bold text-text-main">Configurar Metas de Projeção</h2>
              <p className="text-sm text-text-secondary">Ajuste os parâmetros para recalcular as metas do ano.</p>
            </div>
          </div>
          <Icons.ChevronDown className={`h-5 w-5 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </summary>
        <div className="p-6 border-t border-border space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <InputField name="ticket_medio" label="Ticket Médio" type="currency" />
                 <InputField name="clientes_atuais" label="Clientes Atuais" />
                 <InputField name="churn_meta" label="Meta Churn Mensal" type="percent" />
                 <InputField name="adicao_mensal" label="Adição Mensal (Clientes)" />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Cenário de Crescimento</label>
                <div className="grid grid-cols-3 bg-bg-subtle p-1 rounded-lg">
                    {(Object.keys(SCENARIOS) as Scenario[]).map(s => (
                        <button key={s} onClick={() => handleScenarioChange(s)} className={`py-2 px-4 rounded-md font-bold transition-all text-sm capitalize ${config.cenario === s ? 'bg-brand-blue text-white shadow' : 'text-text-secondary hover:text-text-main'}`}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <InputField name="leads_meta_base" label="Meta de Leads/mês" />
                 <InputField name="conversao_meta" label="Meta de Conversão" type="percent" />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-border">
                 <button onClick={handleReset} className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-main hover:bg-bg-subtle rounded-lg transition-colors">Resetar</button>
                 <button onClick={handleApply} className="w-full sm:w-auto px-6 py-2 text-sm font-bold text-white bg-brand-blue hover:bg-blue-600 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Icons.RefreshCw className="w-4 h-4"/> Aplicar e Recalcular
                 </button>
            </div>
        </div>
      </details>
       <div className="p-4 border-t border-border">
            <label className="text-sm font-medium text-text-secondary">Visualizando o ano de:</label>
             <select 
                value={selectedYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="ml-2 bg-background border border-border rounded-lg px-3 py-1 text-text-main focus:outline-none focus:ring-1 focus:ring-brand-blue"
              >
                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
       </div>
    </div>
  );
};

export default ObjectivesConfigurator;
