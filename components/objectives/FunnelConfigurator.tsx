
import React from 'react';
import { FunnelConfig } from '../../types';
import * as Icons from '../Icons';
import { formatNumber, formatCurrency } from '../../utils/formatters';

interface FunnelConfiguratorProps {
  config: FunnelConfig;
  setConfig: (config: FunnelConfig) => void;
  onSave: (config: FunnelConfig) => void;
  availableYears: number[];
  onYearChange: (year: number) => void;
}

const FunnelConfigurator: React.FC<FunnelConfiguratorProps> = ({ config, setConfig, onSave, availableYears, onYearChange }) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: Number(e.target.value) || 0 });
  };
  
  // Derived calculations
  const leadsMes = config.cpl > 0 ? config.investimento_mensal / config.cpl : 0;
  const agendamentosMes = leadsMes * (config.taxa_agendamento / 100);
  const reunioesMes = agendamentosMes * (config.taxa_comparecimento / 100);
  const vendasMes = reunioesMes * (config.taxa_conversao / 100);
  const valorVendidoMes = vendasMes * config.ticket_medio;
  const roas = config.investimento_mensal > 0 ? valorVendidoMes / config.investimento_mensal : 0;


  const InputField: React.FC<{ name: keyof FunnelConfig, label: string, type: 'currency' | 'number' | 'percent' }> = ({ name, label, type }) => (
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

  const CalculatedField: React.FC<{ label: string, value: string | number, format?: 'number' | 'currency' | 'roas' }> = ({ label, value, format }) => {
      let formattedValue = '';
      if (typeof value === 'number') {
        if (format === 'number') formattedValue = formatNumber(value);
        else if (format === 'currency') formattedValue = formatCurrency(value);
        else if (format === 'roas') formattedValue = `${value.toFixed(2)}x`;
        else formattedValue = value.toString();
      } else {
        formattedValue = value;
      }

      return (
        <div className="bg-bg-subtle/50 border-l-4 border-brand-blue p-3 rounded-r-md">
            <p className="text-sm text-text-secondary">{label}</p>
            <p className="text-lg font-bold text-text-main flex items-center gap-2">
                <Icons.CheckCircle className="h-4 w-4 text-brand-green"/> {formattedValue}
            </p>
        </div>
      );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm h-full flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center">
             <h3 className="text-lg font-bold text-text-main">Configurar Funil de Vendas</h3>
             <select 
                value={config.ano}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="ml-2 bg-background border border-border rounded-lg px-3 py-1 text-text-main focus:outline-none focus:ring-1 focus:ring-brand-blue text-sm"
              >
                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-grow">
            <InputField name="faturamento_anual_meta" label="Meta de Faturamento Anual" type="currency" />
            <InputField name="ticket_medio" label="Ticket Médio" type="currency" />
            <InputField name="clientes_atuais" label="Clientes Atuais Ativos" type="number" />
            
            <hr className="border-border/50 my-6"/>

            <InputField name="investimento_mensal" label="Investimento Mensal em Anúncios" type="currency" />
            <InputField name="cpl" label="CPL Esperado (Custo por Lead)" type="currency" />
            <CalculatedField label="Leads/mês" value={leadsMes.toFixed(1)} />

            <hr className="border-border/50 my-6"/>

            <InputField name="taxa_agendamento" label="Taxa de Agendamento" type="percent" />
            <CalculatedField label="Agendamentos/mês" value={agendamentosMes.toFixed(1)} />

            <InputField name="taxa_comparecimento" label="Taxa de Comparecimento" type="percent" />
            <CalculatedField label="Reuniões Realizadas/mês" value={reunioesMes.toFixed(1)} />

            <InputField name="taxa_conversao" label="Taxa de Conversão" type="percent" />
            <CalculatedField label="Vendas/mês" value={vendasMes.toFixed(1)} />
            
            <hr className="border-border/50 my-6"/>
            
            <CalculatedField label="Valor Vendido/mês" value={valorVendidoMes} format="currency" />
            <CalculatedField label="ROAS" value={roas} format="roas" />
        </div>
        <div className="p-4 border-t border-border mt-auto">
             <button onClick={() => onSave(config)} className="w-full px-6 py-3 text-sm font-bold text-white bg-brand-blue hover:bg-blue-600 rounded-lg transition-colors flex items-center justify-center gap-2">
                <Icons.CheckCircle className="w-4 h-4"/> Salvar Configuração
             </button>
        </div>
    </div>
  );
};

export default FunnelConfigurator;
