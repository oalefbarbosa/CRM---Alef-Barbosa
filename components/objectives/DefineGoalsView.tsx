
import React from 'react';
import { FunnelConfig, Projections, ScenarioSetting, ScenarioType } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import ChartCard from '../ChartCard';
import { Line } from 'react-chartjs-2';
import * as Icons from '../Icons';

// --- SUB-COMPONENTS ---

const SummaryCard: React.FC<{ title: string, value: string }> = ({ title, value }) => (
    <div className="bg-bg-subtle border border-border/50 rounded-lg p-3 text-center">
        <p className="text-xs text-text-secondary uppercase font-bold">{title}</p>
        <p className="text-xl font-extrabold text-text-main">{value}</p>
    </div>
);

const FaturamentoProjectionChart: React.FC<{ projections: Projections }> = ({ projections }) => {
    const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' as const, align: 'end' as const, labels: { color: 'var(--color-text-secondary)', boxWidth: 10 } } }, scales: { y: { ticks: { color: 'var(--color-text-secondary)', callback: (v: any) => formatCurrency(v) }, grid: { color: 'var(--color-border)' } }, x: { ticks: { color: 'var(--color-text-secondary)' }, grid: { display: false } } } };
    const chartData = { labels, datasets: [ { label: 'Inicial', data: projections.inicial.map(p => p.faturamento_projetado), borderColor: '#6b7280', borderDash: [5, 5], tension: 0.3, pointRadius: 0, }, { label: 'Bom', data: projections.bom.map(p => p.faturamento_projetado), borderColor: '#3b82f6', borderDash: [10, 5], tension: 0.3, pointRadius: 0, }, { label: 'Ótimo', data: projections.otimo.map(p => p.faturamento_projetado), borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.1)', fill: true, tension: 0.3, pointRadius: 0, } ] };
    return <Line data={chartData} options={chartOptions} />;
};

const VisualFunnelProjection: React.FC<{ config: FunnelConfig }> = ({ config }) => {
    const leadsMes = config.cpl > 0 ? config.investimento_mensal / config.cpl : 0;
    const agendamentosMes = leadsMes * (config.taxa_agendamento / 100);
    const reunioesMes = agendamentosMes * (config.taxa_comparecimento / 100);
    const vendasMes = reunioesMes * (config.taxa_conversao / 100);
    const stages = [ { name: 'Leads', value: leadsMes, color: 'bg-blue-500' }, { name: 'Agendamentos', value: agendamentosMes, color: 'bg-cyan-500' }, { name: 'Reuniões', value: reunioesMes, color: 'bg-yellow-500' }, { name: 'Vendas', value: vendasMes, color: 'bg-green-500' } ];
    return ( <div className="space-y-1">{stages.map(stage => ( <div key={stage.name} className="flex items-center gap-2"> <div className="w-28 text-right text-xs text-text-secondary">{stage.name}</div> <div className="flex-grow bg-bg-subtle rounded-full h-6"> <div className={`${stage.color} h-6 rounded-full flex items-center justify-end pr-2`} style={{ width: `${Math.max(5, (stage.value / (leadsMes || 1)) * 100)}%`}}> <span className="text-white font-bold text-xs">{formatNumber(stage.value)}</span> </div> </div> </div> ))} </div> );
};

// --- MAIN VIEW COMPONENT ---

interface DefineGoalsViewProps {
  funnelConfig: FunnelConfig;
  setFunnelConfig: (config: FunnelConfig) => void;
  scenarioSettings: ScenarioSetting[];
  onScenarioSettingChange: (name: ScenarioType, field: 'churn' | 'adicao_mensal', value: number) => void;
  onSave: () => void;
  projections: Projections;
  availableYears: number[];
  onYearChange: (year: number) => void;
}

const DefineGoalsView: React.FC<DefineGoalsViewProps> = ({ funnelConfig, setFunnelConfig, scenarioSettings, onScenarioSettingChange, onSave, projections, availableYears, onYearChange }) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFunnelConfig({ ...funnelConfig, [e.target.name]: Number(e.target.value) || 0 });
  };
  
  // Derived calculations
  const leadsMes = funnelConfig.cpl > 0 ? funnelConfig.investimento_mensal / funnelConfig.cpl : 0;
  const agendamentosMes = leadsMes * (funnelConfig.taxa_agendamento / 100);
  const reunioesMes = agendamentosMes * (funnelConfig.taxa_comparecimento / 100);
  const vendasMes = reunioesMes * (funnelConfig.taxa_conversao / 100);
  const valorVendidoMes = vendasMes * funnelConfig.ticket_medio;
  const roas = funnelConfig.investimento_mensal > 0 ? valorVendidoMes / funnelConfig.investimento_mensal : 0;
  
  const totalClientesProjetado = funnelConfig.clientes_atuais + (vendasMes * 12);
  const totalLeadsAno = leadsMes * 12;
  
  const InputField: React.FC<{ name: keyof FunnelConfig, label: string, type: 'currency' | 'number' | 'percent' }> = ({ name, label, type }) => (
    <div> <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label> <div className="relative"> {type === 'currency' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>} <input type="number" name={name} value={funnelConfig[name]} onChange={handleInputChange} className={`w-full bg-background border border-border rounded-lg py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono ${type === 'currency' ? 'pl-8 pr-3' : type === 'percent' ? 'pr-9 pl-3' : 'px-3'}`} /> {type === 'percent' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">%</span>} </div> </div>
  );

  const scenarioBorders: Record<ScenarioType, string> = { inicial: 'border-slate-500', bom: 'border-blue-500', otimo: 'border-green-500' };

  return (
    <div className="space-y-6">
      {/* SEÇÃO 1: RESUMO ANUAL */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard title="Meta Anual" value={formatCurrency(funnelConfig.faturamento_anual_meta)} />
              <SummaryCard title="Clientes/Ano (Funil)" value={formatNumber(totalClientesProjetado)} />
              <SummaryCard title="Leads/Ano (Funil)" value={formatNumber(totalLeadsAno)} />
          </div>
      </div>
      
      {/* SEÇÃO 2: CONFIGURADOR FUNIL */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-text-main mb-1">Configurar Funil de Vendas</h3>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-text-secondary">Ajuste as premissas para calcular as metas mensais.</p>
          <select value={funnelConfig.ano} onChange={(e) => onYearChange(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-1 text-sm text-text-main focus:outline-none focus:ring-1 focus:ring-brand-blue">
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Coluna Esquerda: Inputs */}
            <div className="grid grid-cols-2 gap-4">
                <InputField name="faturamento_anual_meta" label="Meta Faturamento" type="currency" />
                <InputField name="ticket_medio" label="Ticket Médio" type="currency" />
                <InputField name="clientes_atuais" label="Clientes Atuais" type="number" />
                <InputField name="investimento_mensal" label="Investimento Mensal" type="currency" />
                <InputField name="cpl" label="CPL Esperado" type="currency" />
                <InputField name="taxa_agendamento" label="Taxa Agendamento" type="percent" />
                <InputField name="taxa_comparecimento" label="Taxa Comparec." type="percent" />
                <InputField name="taxa_conversao" label="Taxa Conversão" type="percent" />
            </div>
            {/* Coluna Direita: Calculados */}
            <div className="bg-bg-subtle border border-border rounded-lg p-4 space-y-2 text-sm h-full">
                <h4 className="font-bold text-base text-text-main mb-3">Funil Calculado</h4>
                <div className="flex justify-between items-center"><span className="text-text-secondary">Leads/mês</span><span className="font-mono font-bold text-text-main">{formatNumber(leadsMes)}</span></div>
                <div className="flex justify-between items-center"><span className="text-text-secondary">Agendamentos/mês</span><span className="font-mono font-bold text-text-main">{formatNumber(agendamentosMes)}</span></div>
                <div className="flex justify-between items-center"><span className="text-text-secondary">Reuniões/mês</span><span className="font-mono font-bold text-text-main">{formatNumber(reunioesMes)}</span></div>
                <div className="flex justify-between items-center"><span className="text-text-secondary">Vendas/mês</span><span className="font-mono font-bold text-text-main">{formatNumber(vendasMes)}</span></div>
                <hr className="border-border/50 my-2" />
                <div className="flex justify-between items-center"><span className="text-text-secondary">Valor Vendido/mês</span><span className="font-mono font-bold text-green-400">{formatCurrency(valorVendidoMes)}</span></div>
                <div className="flex justify-between items-center"><span className="text-text-secondary">ROAS</span><span className={`font-mono font-bold ${roas > 2.5 ? 'text-green-400' : 'text-yellow-400'}`}>{roas.toFixed(2)}x</span></div>
            </div>
        </div>
         <div className="mt-6 flex justify-end">
             <button onClick={onSave} className="px-6 py-2 text-sm font-bold text-white bg-brand-blue hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2"> <Icons.CheckCircle className="w-4 h-4"/> Salvar Configuração </button>
         </div>
      </div>
      
      {/* SEÇÃO 3: CONFIGURADOR CENÁRIOS */}
       <div className="bg-card border border-border rounded-xl shadow-sm p-6">
           <h3 className="text-lg font-bold text-text-main mb-4">Definir Cenários de Crescimento</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarioSettings.map((setting) => {
                  const projection = projections[setting.name];
                  const finalMonth = projection[11];
                  return (
                    <div key={setting.name} className={`bg-bg-subtle border-t-4 ${scenarioBorders[setting.name]} rounded-lg p-4 space-y-3`}>
                        <h4 className="font-bold text-text-main capitalize">{setting.name}</h4>
                        <div> <label className="block text-xs font-medium text-text-secondary mb-1">Churn Mensal</label> <div className="relative"> <input type="number" value={setting.churn} onChange={(e) => onScenarioSettingChange(setting.name, 'churn', Number(e.target.value))} className="w-full bg-background border border-border rounded-lg p-2 pr-8 text-text-main font-mono" /> <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">%</span> </div> </div>
                        <div> <label className="block text-xs font-medium text-text-secondary mb-1">Adição Mensal (Clientes)</label> <input type="number" value={setting.adicao_mensal} onChange={(e) => onScenarioSettingChange(setting.name, 'adicao_mensal', Number(e.target.value))} className="w-full bg-background border border-border rounded-lg p-2 text-text-main font-mono" /> </div>
                        <hr className="border-border/50" />
                        <div className="text-xs"> <p className="text-text-secondary">Fat. Dezembro: <span className="font-bold text-text-main">{formatCurrency(finalMonth.faturamento_projetado)}</span></p> <p className="text-text-secondary">Clientes Dezembro: <span className="font-bold text-text-main">{formatNumber(finalMonth.clientes_projetados)}</span></p> </div>
                    </div>
                  );
              })}
           </div>
       </div>

      <ChartCard title="Projeção de Faturamento (Cenários)" loading={false} contentClassName="h-64"> <FaturamentoProjectionChart projections={projections} /> </ChartCard>
      <ChartCard title="Funil Mensal Projetado" loading={false}> <VisualFunnelProjection config={funnelConfig} /> </ChartCard>

      {/* SEÇÃO 6: PROJEÇÃO TRIMESTRAL */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-text-main mb-4">Projeção por Trimestre (Cenário "Bom")</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map(q => {
                const start = q * 3;
                const end = start + 3;
                const quarterData = projections.bom.slice(start, end);
                const fat = quarterData.reduce((s, m) => s + m.faturamento_projetado, 0);
                return (
                    <div key={q} className="bg-bg-subtle border border-border/50 rounded-lg p-4 text-center">
                        <p className="font-bold text-text-main">{q+1}º Trimestre</p>
                        <p className="font-bold text-lg text-brand-blue">{formatCurrency(fat)}</p>
                        <p className="text-xs text-text-secondary">Leads: {formatNumber(leadsMes * 3)}</p>
                        <p className="text-xs text-text-secondary">Vendas: {formatNumber(vendasMes * 3)}</p>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default DefineGoalsView;
