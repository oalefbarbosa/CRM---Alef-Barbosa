
import React from 'react';
import { FunnelConfig, Projections, ScenarioSetting, ScenarioType } from '../../types';
import { formatCurrency, formatNumber, formatNumberAbbreviated, formatDecimal } from '../../utils/formatters';
import ChartCard from '../ChartCard';
import { Bar } from 'react-chartjs-2';
import * as Icons from '../Icons';

// --- SUB-COMPONENTS ---

interface InputFieldProps {
  name: keyof FunnelConfig;
  label: string;
  type: 'currency' | 'number' | 'percent';
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ name, label, type, value, onChange }) => (
    <div>
        <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
        <div className="relative">
            {type === 'currency' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">R$</span>}
            <input
                type="number"
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full bg-background border border-border rounded-lg py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue font-sans ${type === 'currency' ? 'pl-8 pr-3' : type === 'percent' ? 'pr-9 pl-3' : 'px-3'}`}
            />
            {type === 'percent' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">%</span>}
        </div>
    </div>
);


const SummaryCard: React.FC<{ title: string, value: string }> = ({ title, value }) => (
    <div className="bg-bg-subtle border border-border/50 rounded-lg p-3 text-center">
        <p className="text-xs text-text-secondary uppercase font-bold">{title}</p>
        <p className="text-xl font-extrabold text-text-main">{value}</p>
    </div>
);

const FaturamentoProjectionChart: React.FC<{ projections: Projections }> = ({ projections }) => {
    const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' as const, align: 'end' as const, labels: { color: 'var(--color-text-secondary)', boxWidth: 10 } } }, scales: { y: { ticks: { color: 'var(--color-text-secondary)', callback: (v: any) => formatNumberAbbreviated(v) }, grid: { color: 'var(--color-border)' } }, x: { ticks: { color: 'var(--color-text-secondary)' }, grid: { display: false } } } };
    const chartData = { labels, datasets: [ { label: 'Inicial', data: projections.inicial.map(p => p.faturamento_projetado), backgroundColor: '#6b7280', }, { label: 'Bom', data: projections.bom.map(p => p.faturamento_projetado), backgroundColor: '#3b82f6', }, { label: 'Ótimo', data: projections.otimo.map(p => p.faturamento_projetado), backgroundColor: '#22c55e', } ] };
    return <Bar data={chartData} options={chartOptions} />;
};

const MetricRow: React.FC<{label: string; value: string;}> = ({label, value}) => (
    <div className="flex justify-between items-center text-sm py-2 border-b border-border/50 last:border-b-0">
        <span className="text-text-secondary">{label}</span>
        <span className="font-sans font-bold text-text-main">{value}</span>
    </div>
);


// --- MAIN VIEW COMPONENT ---

interface DefineGoalsViewProps {
  funnelConfig: FunnelConfig;
  setFunnelConfig: (config: FunnelConfig) => void;
  scenarioSettings: ScenarioSetting[];
  onScenarioSettingChange: (name: ScenarioType, field: 'churn' | 'adicao_mensal', value: number) => void;
  projections: Projections;
  availableYears: number[];
  onYearChange: (year: number) => void;
  savingStatus: 'idle' | 'saving' | 'saved' | 'error';
}

const DefineGoalsView: React.FC<DefineGoalsViewProps> = ({ funnelConfig, setFunnelConfig, scenarioSettings, onScenarioSettingChange, projections, availableYears, onYearChange, savingStatus }) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFunnelConfig({ ...funnelConfig, [e.target.name]: Number(e.target.value) || 0 });
  };
  
  // --- FUNIL NECESSÁRIO (PARA BATER A META) ---
  const valor_total_contrato = funnelConfig.ticket_medio * funnelConfig.duracao_contrato_meses;
  const vendasAnoNecessarias = valor_total_contrato > 0 ? funnelConfig.faturamento_anual_meta / valor_total_contrato : 0;
  const vendasMesNecessarias = vendasAnoNecessarias / 12;
  const reunioesMesNecessarias = funnelConfig.taxa_conversao > 0 ? vendasMesNecessarias / (funnelConfig.taxa_conversao / 100) : 0;
  const agendamentosMesNecessarios = funnelConfig.taxa_comparecimento > 0 ? reunioesMesNecessarias / (funnelConfig.taxa_comparecimento / 100) : 0;
  const leadsMesNecessarios = funnelConfig.taxa_agendamento > 0 ? agendamentosMesNecessarios / (funnelConfig.taxa_agendamento / 100) : 0;
  const investimentoMesNecessario = leadsMesNecessarios * funnelConfig.cpl;

  // Anual Necessário
  const leadsAnoNecessarios = leadsMesNecessarios * 12;
  const investimentoAnoNecessario = investimentoMesNecessario * 12;
  
  // Daily Metrics
  const DIAS_UTEIS_MES = 21; // Average working days in a month
  const vendasDiaNecessarias = vendasMesNecessarias / DIAS_UTEIS_MES;
  const leadsDiaNecessarios = leadsMesNecessarios / DIAS_UTEIS_MES;

  // --- FUNIL ATUAL (PROJETADO PELO INVESTIMENTO) ---
  const leadsMesAtual = funnelConfig.cpl > 0 ? funnelConfig.investimento_mensal / funnelConfig.cpl : 0;
  const agendamentosMesAtual = leadsMesAtual * (funnelConfig.taxa_agendamento / 100);
  const reunioesMesAtual = agendamentosMesAtual * (funnelConfig.taxa_comparecimento / 100);
  const vendasMesAtual = reunioesMesAtual * (funnelConfig.taxa_conversao / 100);
  const faturamentoMesAtual = vendasMesAtual * funnelConfig.ticket_medio;
  const roasAtual = funnelConfig.investimento_mensal > 0 ? faturamentoMesAtual / funnelConfig.investimento_mensal : 0;

  // Anual Atual
  const faturamentoAnoAtual = faturamentoMesAtual * 12;
  const leadsAnoAtual = leadsMesAtual * 12;
  const vendasAnoAtual = vendasMesAtual * 12;
  const investimentoAnoAtual = funnelConfig.investimento_mensal * 12;

  const metaAtingidaPercentual = funnelConfig.faturamento_anual_meta > 0 ? (faturamentoAnoAtual / funnelConfig.faturamento_anual_meta) * 100 : 0;
  
  const scenarioBorders: Record<ScenarioType, string> = { inicial: 'border-slate-500', bom: 'border-blue-500', otimo: 'border-green-500' };

  return (
    <div className="space-y-6">
      {/* SEÇÃO 1: RESUMO ANUAL (BASEADO NO NECESSÁRIO) */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-4 space-y-4">
          {/* Row 1: Annual */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard title="Meta Anual" value={formatCurrency(funnelConfig.faturamento_anual_meta)} />
              <SummaryCard title="Vendas/Ano (Necessário)" value={formatNumber(Math.round(vendasAnoNecessarias))} />
              <SummaryCard title="Leads/Ano (Necessário)" value={formatNumber(Math.round(leadsAnoNecessarios))} />
          </div>
          {/* Separator */}
          <hr className="border-border/50" />
          {/* Row 2: Monthly & Daily */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SummaryCard title="Vendas/Mês (Necessário)" value={formatNumber(Math.round(vendasMesNecessarias))} />
              <SummaryCard title="Leads/Mês (Necessário)" value={formatNumber(Math.round(leadsMesNecessarios))} />
              <SummaryCard title="Vendas/Dia (Necessário)" value={formatDecimal(vendasDiaNecessarias)} />
              <SummaryCard title="Leads/Dia (Necessário)" value={formatDecimal(leadsDiaNecessarios)} />
          </div>
      </div>
      
      {/* SEÇÃO 2: CONFIGURADOR FUNIL */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-text-main mb-1">Configurar Funil de Vendas</h3>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-text-secondary">Ajuste as premissas para calcular as projeções.</p>
          <select value={funnelConfig.ano} onChange={(e) => onYearChange(Number(e.target.value))} className="bg-background border border-border rounded-lg px-3 py-1 text-sm text-text-main focus:outline-none focus:ring-1 focus:ring-brand-blue">
            {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField name="faturamento_anual_meta" label="Meta Faturamento" type="currency" value={funnelConfig.faturamento_anual_meta} onChange={handleInputChange} />
            <InputField name="ticket_medio" label="Ticket Médio (MRR)" type="currency" value={funnelConfig.ticket_medio} onChange={handleInputChange} />
            <InputField name="duracao_contrato_meses" label="Duração Contrato (meses)" type="number" value={funnelConfig.duracao_contrato_meses} onChange={handleInputChange} />
            <InputField name="clientes_atuais" label="Clientes Atuais" type="number" value={funnelConfig.clientes_atuais} onChange={handleInputChange} />
            <InputField name="investimento_mensal" label="Investimento Mensal" type="currency" value={funnelConfig.investimento_mensal} onChange={handleInputChange} />
            <InputField name="cpl" label="CPL Esperado" type="currency" value={funnelConfig.cpl} onChange={handleInputChange} />
            <InputField name="taxa_agendamento" label="Taxa Agendamento" type="percent" value={funnelConfig.taxa_agendamento} onChange={handleInputChange} />
            <InputField name="taxa_comparecimento" label="Taxa Comparec." type="percent" value={funnelConfig.taxa_comparecimento} onChange={handleInputChange} />
            <InputField name="taxa_conversao" label="Taxa Conversão" type="percent" value={funnelConfig.taxa_conversao} onChange={handleInputChange} />
        </div>
      </div>
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* SEÇÃO 3: PROJEÇÃO PARA BATER META */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                <h3 className="text-base font-bold text-text-main mb-3">📎 Projeção para Bater a Meta</h3>
                 <table className="w-full">
                    <thead className="text-xs text-text-secondary uppercase"><tr><th className="py-1 text-left font-semibold">Métrica</th><th className="py-1 text-right font-semibold">Mensal</th><th className="py-1 text-right font-semibold">Anual</th></tr></thead>
                    <tbody>
                        <tr className="border-t border-border/50"><td className="py-2 text-sm">Leads necessários</td><td className="py-2 text-right font-mono font-bold">{formatNumber(Math.round(leadsMesNecessarios))}</td><td className="py-2 text-right font-mono">{formatNumber(Math.round(leadsAnoNecessarios))}</td></tr>
                        <tr className="border-t border-border/50"><td className="py-2 text-sm">Agendamentos</td><td className="py-2 text-right font-mono font-bold">{formatNumber(Math.round(agendamentosMesNecessarios))}</td><td className="py-2 text-right font-mono">{formatNumber(Math.round(agendamentosMesNecessarios*12))}</td></tr>
                        <tr className="border-t border-border/50"><td className="py-2 text-sm">Reuniões</td><td className="py-2 text-right font-mono font-bold">{formatNumber(Math.round(reunioesMesNecessarias))}</td><td className="py-2 text-right font-mono">{formatNumber(Math.round(reunioesMesNecessarias*12))}</td></tr>
                        <tr className="border-t border-border/50"><td className="py-2 text-sm">Vendas</td><td className="py-2 text-right font-mono font-bold">{formatNumber(Math.round(vendasMesNecessarias))}</td><td className="py-2 text-right font-mono">{formatNumber(Math.round(vendasAnoNecessarias))}</td></tr>
                        <tr className="border-t border-border/50"><td className="py-2 text-sm">Investimento</td><td className="py-2 text-right font-mono font-bold">{formatCurrency(investimentoMesNecessario)}</td><td className="py-2 text-right font-mono">{formatCurrency(investimentoAnoNecessario)}</td></tr>
                    </tbody>
                 </table>
            </div>

            {/* SEÇÃO 4: FUNIL ATUAL */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                <h3 className="text-base font-bold text-text-main mb-3">📉 Funil com Investimento Atual ({formatCurrency(funnelConfig.investimento_mensal)}/mês)</h3>
                <div className="space-y-1">
                    <MetricRow label="Leads/mês" value={formatNumber(Math.round(leadsMesAtual))} />
                    <MetricRow label="Agendamentos/mês" value={formatNumber(Math.round(agendamentosMesAtual))} />
                    <MetricRow label="Reuniões/mês" value={formatNumber(Math.round(reunioesMesAtual))} />
                    <MetricRow label="Vendas/mês" value={formatNumber(Math.round(vendasMesAtual))} />
                    <MetricRow label="Valor Vendido/mês" value={formatCurrency(faturamentoMesAtual)} />
                    <MetricRow label="Faturamento/ano projetado" value={formatCurrency(faturamentoAnoAtual)} />
                    <MetricRow label="ROAS" value={`${roasAtual.toFixed(2)}x`} />
                </div>
            </div>
       </div>

      {/* SEÇÃO 5: ANÁLISE DE GAP */}
       <div className="bg-card border border-border rounded-xl shadow-sm p-6">
           <h3 className="text-lg font-bold text-text-main mb-4">Análise de Gap</h3>
            <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-lg flex flex-col sm:flex-row items-center gap-3 text-orange-400 mb-6">
                <Icons.AlertTriangle className="h-8 w-8 flex-shrink-0" />
                <div>
                    <p className="font-bold">⚠️ Alerta: Investimento atual atinge apenas {formatNumber(Math.round(metaAtingidaPercentual))}% da meta.</p>
                    <p className="text-sm">💡 Para bater a meta, aumente o investimento para {formatCurrency(investimentoMesNecessario)}/mês ou melhore as taxas de conversão do funil.</p>
                </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm">
                     <thead className="text-xs text-text-secondary uppercase"><tr><th className="py-1 text-left font-semibold">Métrica Anual</th><th className="py-1 text-right font-semibold">Necessário</th><th className="py-1 text-right font-semibold">Atual</th><th className="py-1 text-right font-semibold">Gap</th></tr></thead>
                     <tbody>
                        <tr className="border-t border-border/50"><td className="py-2">Faturamento/ano</td><td className="py-2 text-right font-mono">{formatCurrency(funnelConfig.faturamento_anual_meta)}</td><td className="py-2 text-right font-mono">{formatCurrency(faturamentoAnoAtual)}</td><td className="py-2 text-right font-mono text-brand-red font-bold">{formatCurrency(faturamentoAnoAtual - funnelConfig.faturamento_anual_meta)}</td></tr>
                        <tr className="border-t border-border/50"><td className="py-2">Vendas/ano</td><td className="py-2 text-right font-mono">{formatNumber(Math.round(vendasAnoNecessarias))}</td><td className="py-2 text-right font-mono">{formatNumber(Math.round(vendasAnoAtual))}</td><td className="py-2 text-right font-mono text-brand-red font-bold">{formatNumber(Math.round(vendasAnoAtual - vendasAnoNecessarias))}</td></tr>
                        <tr className="border-t border-border/50"><td className="py-2">Leads/ano</td><td className="py-2 text-right font-mono">{formatNumber(Math.round(leadsAnoNecessarios))}</td><td className="py-2 text-right font-mono">{formatNumber(Math.round(leadsAnoAtual))}</td><td className="py-2 text-right font-mono text-brand-red font-bold">{formatNumber(Math.round(leadsAnoAtual - leadsAnoNecessarios))}</td></tr>
                        <tr className="border-t border-border/50"><td className="py-2">Investimento/ano</td><td className="py-2 text-right font-mono">{formatCurrency(investimentoAnoNecessario)}</td><td className="py-2 text-right font-mono">{formatCurrency(investimentoAnoAtual)}</td><td className="py-2 text-right font-mono text-brand-red font-bold">{formatCurrency(investimentoAnoAtual - investimentoAnoNecessario)}</td></tr>
                     </tbody>
                </table>
            </div>
       </div>

      {/* SEÇÃO 6: CONFIGURADOR CENÁRIOS */}
       <div className="bg-card border border-border rounded-xl shadow-sm p-6">
           <h3 className="text-lg font-bold text-text-main mb-4">Simular Cenários de Crescimento (Receita Recorrente)</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarioSettings.map((setting) => {
                  const projection = projections[setting.name];
                  const finalMonth = projection[11];
                  return (
                    <div key={setting.name} className={`bg-bg-subtle border-t-4 ${scenarioBorders[setting.name]} rounded-lg p-4 space-y-3`}>
                        <h4 className="font-bold text-text-main capitalize">{setting.name}</h4>
                        <div> <label className="block text-xs font-medium text-text-secondary mb-1">Churn Mensal</label> <div className="relative"> <input type="number" value={setting.churn} onChange={(e) => onScenarioSettingChange(setting.name, 'churn', Number(e.target.value))} className="w-full bg-background border border-border rounded-lg p-2 pr-8 text-text-main font-sans" /> <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">%</span> </div> </div>
                        <div> <label className="block text-xs font-medium text-text-secondary mb-1">Adição Mensal (Clientes)</label> <input type="number" value={setting.adicao_mensal} onChange={(e) => onScenarioSettingChange(setting.name, 'adicao_mensal', Number(e.target.value))} className="w-full bg-background border border-border rounded-lg p-2 text-text-main font-sans" /> </div>
                        <hr className="border-border/50" />
                        <div className="text-xs"> <p className="text-text-secondary">Fat. Dezembro: <span className="font-bold text-text-main">{formatCurrency(finalMonth.faturamento_projetado)}</span></p> <p className="text-text-secondary">Clientes Dezembro: <span className="font-bold text-text-main">{formatNumber(finalMonth.clientes_projetados)}</span></p> </div>
                    </div>
                  );
              })}
           </div>
       </div>

      <ChartCard title="Projeção de Faturamento (Cenários)" loading={false} contentClassName="h-64"> <FaturamentoProjectionChart projections={projections} /> </ChartCard>

    </div>
  );
};

export default DefineGoalsView;