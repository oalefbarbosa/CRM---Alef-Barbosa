
import React from 'react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';
import ProgressBar from './ProgressBar';
import * as Icons from './Icons';

interface ProgressCardProps {
  title: string;
  realized: number;
  goal: number;
  format: 'number' | 'currency' | 'percent';
  icon: React.ReactNode;
}

const ProgressCard: React.FC<ProgressCardProps> = ({ title, realized, goal, format, icon }) => {
  const percentage = goal > 0 ? (realized / goal) * 100 : 0;

  const getProgressBarColor = () => {
    if (percentage >= 80) return 'bg-brand-green';
    if (percentage >= 50) return 'bg-brand-yellow';
    return 'bg-brand-red';
  };

  const formattedRealized = format === 'currency' ? formatCurrency(realized) : format === 'percent' ? formatPercent(realized) : formatNumber(realized);
  const formattedGoal = format === 'currency' ? formatCurrency(goal) : format === 'percent' ? `${formatNumber(goal)}%` : formatNumber(goal);

  return (
    <div className="bg-card border border-border p-5 rounded-xl shadow-lg">
      <div className="flex items-center justify-between text-text-secondary">
        <p className="text-sm font-bold uppercase tracking-wide">{title}</p>
        {icon}
      </div>
      <div className="mt-2">
        <span className="text-3xl font-extrabold text-text-main">{formattedRealized}</span>
        <span className="text-lg font-semibold text-text-secondary"> / {formattedGoal}</span>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-baseline">
            <span className="text-xs text-text-secondary">Progresso</span>
            <span className={`text-sm font-bold ${getProgressBarColor().replace('bg-','text-')}`}>{formatPercent(percentage)}</span>
        </div>
        <ProgressBar value={realized} max={goal} colorClass={getProgressBarColor()} />
        {format === 'percent' && realized >= goal && (
            <p className="text-xs text-brand-green font-semibold flex items-center gap-1"><Icons.CheckCircle className="w-3 h-3"/> Meta de conversão atingida</p>
        )}
      </div>
    </div>
  );
};

export default ProgressCard;
