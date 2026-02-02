
import React from 'react';
import { FunnelConfig, Projections } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import ChartCard from '../ChartCard';
import { Line } from 'react-chartjs-2';
import * as Icons from '../Icons';

interface GoalsProjectionProps {
  config: FunnelConfig;
  projections: Projections;
}

const SummaryCard: React.FC<{ title: string, value: string }> = ({ title, value }) => (
    <div className="bg-bg-subtle border border-border/50 rounded-lg p-3 text-center">
        <p className="text-xs text-text-secondary uppercase font-bold">{title}</p>
        <p className="text-xl font-extrabold text-text-main">{value}</p>
    </div>
);

const FaturamentoProjectionChart: React.FC<{ projections: Projections }> = ({ projections }) => {
    const labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const chartData = {
        labels,
        datasets: [
            {
                label: 'Inicial',
                data: projections.inicial.map(p => p.faturamento_projetado),
                borderColor: '#94a3b8',
                borderDash: [5, 5],
                tension: 0.3,
                pointRadius: 0,
            },
            {
                label: 'Bom',
                data: projections.bom.map(p => p.faturamento_projetado),
                borderColor: '#3b82f6',
                borderDash: [10, 5],
                tension: 0.3,
                pointRadius: 0,
            },
            {
                label: 'Ótimo',
                data: projections.otimo.map(p => p.faturamento_projetado),
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 0,
            }
        ]
    };
    const chartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' as const, align: 'end' as const, labels: { color: '#94a3b8', boxWidth: 10 } } },
        scales: { 
            y: { ticks: { color: '#94a3b8', callback: (v: any) => formatCurrency(v) }, grid: { color: '#33415540' } },
            x: { ticks: { color: '#64748b' }, grid: { display: false } }
        }
    };
    return <Line data={chartData} options={chartOptions} />;
};

const VisualFunnelProjection: React.FC<{ config: FunnelConfig }> = ({ config }) => {
    const leadsMes = config.cpl > 0 ? config.investimento_mensal / config.cpl : 0;
    const agendamentosMes = leadsMes * (config.taxa_agendamento / 100);
    const reunioesMes = agendamentosMes * (config.taxa_comparecimento / 100);
    const vendasMes = reunioesMes * (config.taxa_conversao / 100);
    const stages = [
        { name: 'Leads', value: leadsMes, color: 'bg-blue-500' },
        { name: 'Agendamentos', value: agendamentosMes, color: 'bg-cyan-500' },
        { name: 'Reuniões', value: reunioesMes, color: 'bg-yellow-500' },
        { name: 'Vendas', value: vendasMes, color: 'bg-green-500' }
    ];

    return (
         <div className="space-y-1">
            {stages.map(stage => (
                <div key={stage.name} className="flex items-center gap-2">
                    <div className="w-28 text-right text-xs text-text-secondary">{stage.name}</div>
                    <div className="flex-grow bg-bg-subtle rounded-full h-6">
                        <div 
                            className={`${stage.color} h-6 rounded-full flex items-center justify-end pr-2`}
                            style={{ width: `${Math.max(5, (stage.value / (leadsMes || 1)) * 100)}%`}}
                        >
                            <span className="text-white font-bold text-xs">{formatNumber(stage.value)}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const GoalsProjection: React.FC<GoalsProjectionProps> = ({ config, projections }) => {
  const leadsMes = config.cpl > 0 ? config.investimento_mensal / config.cpl : 0;
  const vendasMes = leadsMes * (config.taxa_agendamento / 100) * (config.taxa_comparecimento / 100) * (config.taxa_conversao / 100);

  const totalClientesProjetado = config.clientes_atuais + (vendasMes * 12); // Simplified projection for summary
  const totalLeadsAno = leadsMes * 12;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-text-main mb-4">Resumo Anual Projetado</h3>
          <div className="grid grid-cols-3 gap-4">
              <SummaryCard title="Meta Anual" value={formatCurrency(config.faturamento_anual_meta)} />
              <SummaryCard title="Clientes/Ano" value={formatNumber(totalClientesProjetado)} />
              <SummaryCard title="Leads/Ano" value={formatNumber(totalLeadsAno)} />
          </div>
      </div>

      <ChartCard title="Projeção de Faturamento (Cenários)" loading={false} contentClassName="h-64">
        <FaturamentoProjectionChart projections={projections} />
      </ChartCard>
      
      <ChartCard title="Funil Mensal Projetado" loading={false}>
        <VisualFunnelProjection config={config} />
      </ChartCard>
    </div>
  );
};

export default GoalsProjection;
