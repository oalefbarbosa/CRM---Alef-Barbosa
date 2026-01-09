
import React from 'react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  format: 'currency' | 'number' | 'percent';
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, color, format }) => {
  
  const formattedValue = () => {
    switch(format) {
      case 'currency': return formatCurrency(value);
      case 'number': return formatNumber(value);
      case 'percent': return formatPercent(value);
      default: return value;
    }
  }

  return (
    <div className="bg-card border border-border p-5 rounded-xl shadow-lg hover:border-brand-cyan transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <div className={`h-8 w-8 ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-extrabold text-text-main mt-2">{formattedValue()}</p>
    </div>
  );
};

export default KpiCard;
