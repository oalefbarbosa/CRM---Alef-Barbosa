
import React from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import ProgressBar from '../ProgressBar';

interface PerformanceProgressCardProps {
  title: string;
  realized: number;
  goal: number;
  format: 'currency' | 'number';
}

const PerformanceProgressCard: React.FC<PerformanceProgressCardProps> = ({ title, realized, goal, format }) => {
    const formattedRealized = format === 'currency' ? formatCurrency(realized) : formatNumber(realized);
    const formattedGoal = format === 'currency' ? formatCurrency(goal) : formatNumber(goal);
    const gap = goal - realized;
    const formattedGap = format === 'currency' ? formatCurrency(gap) : formatNumber(gap);
    const percentage = goal > 0 ? (realized / goal) * 100 : 0;
    
    let colorClass = 'bg-brand-red';
    if(percentage >= 80) colorClass = 'bg-brand-green';
    else if (percentage >= 50) colorClass = 'bg-brand-yellow';

    return (
        <div className="bg-card border border-border p-5 rounded-xl shadow-lg flex flex-col justify-between h-full">
            <div>
                <p className="text-sm font-bold uppercase tracking-wide text-text-secondary">{title}</p>
                <p className="text-4xl font-extrabold text-text-main mt-2">{formattedRealized}</p>
                <p className="text-sm text-text-secondary">de {formattedGoal}</p>
            </div>
            <div className="mt-4">
                <ProgressBar value={realized} max={goal} colorClass={colorClass} />
                <p className="text-xs text-text-secondary mt-2">
                    {gap > 0 ? `Faltam ${formattedGap}` : `Superou em ${format === 'currency' ? formatCurrency(Math.abs(gap)) : formatNumber(Math.abs(gap))}`}
                </p>
            </div>
        </div>
    );
};

export default PerformanceProgressCard;
