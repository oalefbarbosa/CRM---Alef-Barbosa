
import React from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import ProgressBar from '../ProgressBar';

const GoalProgressCard: React.FC<{title: string, realized: number, goal: number, format: 'currency'|'number'}> = ({ title, realized, goal, format }) => {
    const percentage = goal > 0 ? (realized / goal) * 100 : 0;
    const remaining = Math.max(0, goal - realized);
    
    return(
        <div className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-sm font-bold text-text-secondary uppercase">{title}</p>
            <p className="text-4xl font-extrabold text-text-main mt-4">{format === 'currency' ? formatCurrency(realized) : formatNumber(realized)}</p>
            <p className="text-xs text-text-secondary">realizado</p>
            <hr className="border-border/50 my-4" />
            <p className="text-sm text-text-secondary">Meta: <span className="font-bold text-text-main">{format === 'currency' ? formatCurrency(goal) : formatNumber(goal)}</span></p>
            <p className="text-sm text-text-secondary">Falta: <span className="font-bold text-brand-red">{format === 'currency' ? formatCurrency(remaining) : formatNumber(remaining)}</span></p>
            <div className="mt-4"><ProgressBar value={realized} max={goal} colorClass="bg-brand-blue" /></div>
        </div>
    );
};

export default GoalProgressCard;
