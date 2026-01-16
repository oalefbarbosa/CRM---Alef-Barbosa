
import React from 'react';

export const DashboardGeralSkeleton: React.FC = () => (
    <div className="space-y-8 animate-pulse">
        {/* Primary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
                <div key={i} className="h-[120px] bg-card rounded-xl"></div>
            ))}
        </div>

        {/* Smart Alert */}
        <div className="h-24 bg-card rounded-xl"></div>

        {/* Prospecting Analysis */}
        <div>
            <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card rounded-xl h-48"></div>
                <div className="bg-card rounded-xl h-48"></div>
                <div className="bg-card rounded-xl h-48"></div>
            </div>
        </div>
        
        {/* FollowUp Analysis */}
         <div>
            <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card rounded-xl h-48"></div>
                <div className="bg-card rounded-xl h-48"></div>
                <div className="bg-card rounded-xl h-48"></div>
            </div>
        </div>

        {/* Funnel + Velocity */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-card rounded-xl h-96"></div>
            <div className="lg:col-span-2 space-y-6">
                <div className="h-48 bg-card rounded-xl"></div>
            </div>
        </div>
    </div>
);


export const DashboardSkeletons: React.FC = () => <DashboardGeralSkeleton />;