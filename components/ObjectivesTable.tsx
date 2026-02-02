
import React from 'react';
// FIX: Module '"./ObjectivesView"' has no exported member 'MergedData'. Changed import to '../types'.
import { MergedData } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import EditableCell from './EditableCell';
import * as Icons from './Icons';

interface ObjectivesTableProps {
  data: MergedData[];
  onUpdateGoal: (mes: number, key: any, value: number) => void;
  onResetGoal: (mes: number) => void;
}

const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const ProgressBadge: React.FC<{ percentage: number }> = ({ percentage }) => {
    let colorClass = 'bg-red-500/10 text-brand-red';
    let text = 'Crítico';
    if (percentage >= 100) {
        colorClass = 'bg-green-500/10 text-brand-green';
        text = 'Atingido ✓';
    } else if (percentage >= 80) {
        colorClass = 'bg-yellow-500/10 text-brand-yellow';
        text = 'No caminho';
    } else if (percentage >= 50) {
        colorClass = 'bg-orange-500/10 text-brand-orange';
        text = 'Atenção';
    }
    return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colorClass}`}>{text}</span>;
};

const ObjectivesTable: React.FC<ObjectivesTableProps> = ({ data, onUpdateGoal, onResetGoal }) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg overflow-x-auto custom-scrollbar">
        <div className="p-4 border-b border-border">
             <h3 className="text-lg font-bold text-text-main">Acompanhamento Mensal Detalhado</h3>
             <p className="text-sm text-text-secondary">Clique em uma meta para editá-la manualmente.</p>
        </div>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-text-secondary uppercase">
          <tr>
            <th className="p-4">Mês</th>
            <th className="p-4 text-right">Leads Meta</th>
            <th className="p-4 text-right">Leads Real</th>
            <th className="p-4 text-right">Vendas Meta</th>
            <th className="p-4 text-right">Vendas Real</th>
            <th className="p-4 text-right">Fat. Meta</th>
            <th className="p-4 text-right">Fat. Real</th>
            <th className="p-4 text-center">% Meta</th>
            <th className="p-4 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row) => {
            const leadsProgress = (row.leads_real / (row.leads_meta || 1));
            const vendasProgress = (row.vendas_real / (row.vendas_meta || 1));
            const fatProgress = (row.faturamento_real / (row.faturamento_meta || 1));
            const progress = (leadsProgress * 0.2 + vendasProgress * 0.4 + fatProgress * 0.4) * 100;
            
            const isCurrentMonth = row.mes === currentMonth && row.ano === currentYear;
            const isFutureMonth = row.ano > currentYear || (row.ano === currentYear && row.mes > currentMonth);
            
            return (
              <tr key={row.id} className={`
                ${isCurrentMonth ? 'bg-blue-500/5' : ''}
                ${isFutureMonth ? 'opacity-60' : ''}
                transition-colors hover:bg-bg-subtle
              `}>
                <td className="p-4 font-bold text-text-main whitespace-nowrap">
                  {progress >= 100 && !isFutureMonth && <span className="text-brand-green mr-2">✓</span>}
                  {monthNames[row.mes - 1]}
                </td>
                <td className="p-2 text-text-main"><EditableCell value={row.leads_meta} onSave={(val) => onUpdateGoal(row.mes, 'leads_meta', val)} format="number" /></td>
                <td className="p-4 text-right font-mono text-text-secondary">{formatNumber(row.leads_real)}</td>
                <td className="p-2 text-text-main"><EditableCell value={row.vendas_meta} onSave={(val) => onUpdateGoal(row.mes, 'vendas_meta', val)} format="number" /></td>
                <td className="p-4 text-right font-mono text-text-secondary">{formatNumber(row.vendas_real)}</td>
                <td className="p-2 text-text-main"><EditableCell value={row.faturamento_meta} onSave={(val) => onUpdateGoal(row.mes, 'faturamento_meta', val)} format="currency" /></td>
                <td className="p-4 text-right font-mono text-text-secondary">{formatCurrency(row.faturamento_real)}</td>
                <td className="p-4 text-center"><ProgressBadge percentage={progress} /></td>
                <td className="p-4 text-center">
                    <button onClick={() => onResetGoal(row.mes)} title="Recalcular meta para este mês" className="p-1 text-text-secondary hover:text-brand-blue rounded-full hover:bg-blue-500/10 transition-colors">
                        <Icons.RefreshCw className="w-4 h-4"/>
                    </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ObjectivesTable;
