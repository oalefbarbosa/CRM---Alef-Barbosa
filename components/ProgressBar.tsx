
import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  colorClass: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, colorClass }) => {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0;

  return (
    <div className="w-full bg-slate-700 rounded-full h-2">
      <div
        className={`${colorClass} h-2 rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;
