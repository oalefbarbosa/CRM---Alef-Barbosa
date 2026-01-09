
import React from 'react';

const KpiCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card border border-border p-5 rounded-xl animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-700 rounded w-3/5"></div>
        <div className="h-8 w-8 bg-slate-700 rounded-full"></div>
      </div>
      <div className="h-8 bg-slate-700 rounded w-1/2 mt-4"></div>
    </div>
  );
};

export default KpiCardSkeleton;
