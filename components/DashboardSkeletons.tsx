
import React from 'react';

const CardSkeleton: React.FC<{className?: string}> = ({ className }) => (
    <div className={`bg-card border border-border p-6 rounded-xl animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700 rounded w-3/5 mb-4"></div>
        <div className="h-10 bg-slate-700 rounded w-1/2 mb-6"></div>
        <div className="space-y-2">
            <div className="h-3 bg-slate-700 rounded w-full"></div>
            <div className="h-3 bg-slate-700 rounded w-4/5"></div>
        </div>
    </div>
);

export const ComparativeKpiSkeleton: React.FC = () => <CardSkeleton className="h-auto"/>;


export const CrmSummarySkeleton: React.FC = () => (
    <section>
        <div className="h-6 bg-slate-700 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <CardSkeleton className="h-[220px]" />
            <CardSkeleton className="h-[220px]" />
            <CardSkeleton className="h-[220px]" />
            <CardSkeleton className="h-[220px]" />
        </div>
    </section>
);

export const FunnelSnapshotSkeleton: React.FC = () => (
    <section>
        <div className="h-6 bg-slate-700 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="bg-card border border-border p-6 rounded-xl animate-pulse space-y-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                    <div className="h-4 bg-slate-700 rounded w-1/5"></div>
                    <div className="h-6 bg-slate-700 rounded w-4/5"></div>
                </div>
            ))}
             <div className="h-4 bg-slate-700 rounded w-1/2 mt-4"></div>
        </div>
    </section>
);

export const CampaignsSummarySkeleton: React.FC = () => (
    <section>
        <div className="h-6 bg-slate-700 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="bg-card border border-border p-6 rounded-xl animate-pulse">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-border pb-6 mb-6">
                <div>
                    <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
                    <div className="h-10 bg-slate-700 rounded w-1/2"></div>
                </div>
                 <div>
                    <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
                    <div className="h-10 bg-slate-700 rounded w-3/4"></div>
                </div>
            </div>
             <div>
                <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-8 bg-slate-700 rounded w-full"></div>
                    <div className="h-8 bg-slate-700 rounded w-full"></div>
                    <div className="h-8 bg-slate-700 rounded w-full"></div>
                </div>
            </div>
        </div>
    </section>
);

export const DashboardSkeletons: React.FC = () => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ComparativeKpiSkeleton />
            <ComparativeKpiSkeleton />
            <ComparativeKpiSkeleton />
        </div>
        <CrmSummarySkeleton />
        <FunnelSnapshotSkeleton />
        <CampaignsSummarySkeleton />
    </div>
);
