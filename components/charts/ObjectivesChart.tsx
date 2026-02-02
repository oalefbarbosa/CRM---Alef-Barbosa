
import React, { useState, useCallback, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
// FIX: Module '"../ObjectivesView"' has no exported member 'MergedData'. Changed import to '../types'.
import { MergedData } from '../types';
import ChartCard from '../ChartCard';
import { formatCurrency, formatNumber } from '../../utils/formatters';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type ChartMetric = 'faturamento' | 'leads' | 'vendas';

const ObjectivesChart: React.FC<{ data: MergedData[] }> = ({ data }) => {
  const [metric, setMetric] = useState<ChartMetric>('faturamento');

  const chartData = useMemo(() => {
    const labels = data.map(d => new Date(d.ano, d.mes - 1, 1).toLocaleString('pt-BR', { month: 'short' }));
    const metaData = data.map(d => d[`${metric}_meta`]);
    const realData = data.map(d => d[`${metric}_real`]);

    return {
      labels,
      datasets: [
        {
          label: 'Meta',
          data: metaData,
          backgroundColor: 'rgba(100, 116, 139, 0.5)',
          borderColor: 'rgba(100, 116, 139, 1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Realizado',
          data: realData,
          backgroundColor: '#3b82f6',
          borderColor: '#60a5fa',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }, [data, metric]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#94a3b8' },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (metric === 'faturamento') {
                label += formatCurrency(context.parsed.y);
              } else {
                label += formatNumber(context.parsed.y);
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
      },
      y: {
        grid: { color: '#334155' },
        ticks: {
          color: '#94a3b8',
          callback: (value: any) => metric === 'faturamento' ? formatCurrency(value) : formatNumber(value),
        },
      },
    },
  };
  
  const ToggleButton: React.FC<{label: string, value: ChartMetric}> = ({ label, value }) => (
      <button onClick={() => setMetric(value)} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${metric === value ? 'bg-brand-blue text-white' : 'bg-bg-subtle text-text-secondary hover:bg-slate-700'}`}>
          {label}
      </button>
  );

  return (
    <ChartCard title="Evolução Anual: Meta vs. Real" loading={false} contentClassName="h-80">
        <div className="flex justify-center gap-2 mb-4">
            <ToggleButton label="Faturamento" value="faturamento" />
            <ToggleButton label="Leads" value="leads" />
            <ToggleButton label="Vendas" value="vendas" />
        </div>
        <div className="h-[calc(100%-40px)]">
             <Bar options={chartOptions} data={chartData} />
        </div>
    </ChartCard>
  );
};

export default ObjectivesChart;
