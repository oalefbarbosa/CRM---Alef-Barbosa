
import React from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import ProgressBar from '../ProgressBar';

const GoalProgressCard: React.FC<{title: string, realized: number, goal: number, format: 'currency'|'number'}> = ({ title, realized, goal, format }) => {
    
    // The progress bar should reflect the true, potentially fractional, progress.
    // The displayed text, however, should be rounded for non-currency values for clarity.
    
    const isNumericFormat = format === 'number';

    // For non-currency values, round them for display.
    // Goals should be rounded up (ceil) as you can't achieve a partial goal.
    const displayRealized = isNumericFormat ? Math.round(realized) : realized;
    const displayGoal = isNumericFormat ? Math.ceil(goal) : goal;
    const displayRemaining = isNumericFormat ? Math.max(0, displayGoal - displayRealized) : Math.max(0, goal - realized);

    const formatDisplayValue = (value: number) => {
        return isNumericFormat ? formatNumber(value) : formatCurrency(value);
    };
    
    return(
        <div className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-sm font-bold text-text-secondary uppercase">{title}</p>
            <p className="text-4xl font-extrabold text-text-main mt-4">{formatDisplayValue(displayRealized)}</p>
            <p className="text-xs text-text-secondary">realizado</p>
            <hr className="border-border/50 my-4" />
            <p className="text-sm text-text-secondary">Meta: <span className="font-bold text-text-main">{formatDisplayValue(displayGoal)}</span></p>
            <p className="text-sm text-text-secondary">Falta: <span className="font-bold text-brand-red">{formatDisplayValue(displayRemaining)}</span></p>
            {/* The progress bar uses the original, precise values to show accurate progress toward the fractional goal */}
            <div className="mt-4"><ProgressBar value={realized} max={goal} colorClass="bg-brand-blue" /></div>
        </div>
    );
};

export default GoalProgressCard;