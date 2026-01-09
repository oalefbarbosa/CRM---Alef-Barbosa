
import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  loading: boolean;
  className?: string;
  contentClassName?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children, loading, className = '', contentClassName = 'h-72' }) => {
  return (
    <div className={`bg-card border border-border p-4 sm:p-6 rounded-xl shadow-lg ${className}`}>
      <h3 className="text-lg font-bold text-text-main mb-4">{title}</h3>
      <div className={contentClassName}>
        {loading ? (
          <div className="w-full h-full bg-slate-700 animate-pulse rounded-md min-h-[288px]"></div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartCard;