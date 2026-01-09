
import React from 'react';
import { ComparativeKpi } from '../types';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import { ArrowUpRight, ArrowDownRight } from './Icons';

interface ComparativeKpiCardProps {
  title: string;
  data: ComparativeKpi;
  format: 'currency' | 'number' | 'percent';
}

const ComparativeKpiCard: React.FC<ComparativeKpiCardProps> = ({ title, data, format }) => {
  const { current, previous, change } = data;

  const formattedValue = (value: number) => {
    switch (format) {
      case 'currency': return formatCurrency(value);
      case 'number': return formatNumber(value);
      case 'percent': return formatPercent(value);
      default: return value;
    }
  };
  
  const isPositive = change >= 0;
  const changeColor = change === 0 ? 'text-text-secondary' : isPositive ? 'text-brand-green' : 'text-brand-red';
  const ChangeIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  const formatChange = () => {
    if (!isFinite(change)) return 'Novo';
    if (format === 'percent') return `${change.toFixed(2)} pts`;
    return `${change.toFixed(0)}%`;
  }

  return (
    <div className="bg-card border border-border p-5 rounded-xl shadow-lg">
      <p className="text-sm font-medium text-text-secondary truncate">{title}</p>
      <div className="flex items-baseline justify-between mt-2">
        <p className="text-3xl font-extrabold text-text-main">{formattedValue(current)}</p>
        {change !== 0 && (
          <div className={`flex items-center text-sm font-semibold ${changeColor}`}>
            <ChangeIcon className="h-4 w-4 mr-1" />
            <span>{formatChange()}</span>
          </div>
        )}
      </div>
      <p className="text-xs text-text-secondary mt-1">vs. período anterior: {formattedValue(previous)}</p>
    </div>
  );
};

export default ComparativeKpiCard;
