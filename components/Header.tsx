
import React from 'react';
import { RefreshCw } from './Icons';
import { formatDate } from '../utils/formatters';
import FilterMenu from './FilterMenu';
import MultiSelectFilter from './MultiSelectFilter';

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (range: { startDate: Date | null; endDate: Date | null }) => void;
  hasActiveFilter: boolean;
  filters: { tipoNegocio: string[], source: string[], status: string[] };
  onFilterChange: (filterType: 'tipoNegocio' | 'source' | 'status', selectedOptions: string[]) => void;
  filterOptions: { tipoNegocio: string[], source: string[], status: string[] };
}

const logoSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.5 14C5.05228 14 5.5 13.5523 5.5 13V12C5.5 11.4477 5.05228 11 4.5 11C3.94772 11 3.5 11.4477 3.5 12V13C3.5 13.5523 3.94772 14 4.5 14Z" stroke="#f8fafc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.5 14C20.0523 14 20.5 13.5523 20.5 13V12C20.5 11.4477 20.0523 11 19.5 11C18.9477 11 18.5 11.4477 18.5 12V13C18.5 13.5523 18.9477 14 19.5 14Z" stroke="#f8fafc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#f8fafc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 21C8.13401 21 5 19.2091 5 17C5 14.7909 8.13401 13 12 13C15.866 13 19 14.7909 19 17C19 19.2091 15.866 21 12 21Z" stroke="#f8fafc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.542 4.4147C15.2441 4.14583 14.8812 4 14.5 4H9.5C8.67157 4 8 4.67157 8 5.5V6.5C8 7.32843 8.67157 8 9.5 8H14.5C15.3284 8 16 7.32843 16 6.5V5.5C16 5.11132 15.8524 4.74233 15.5807 4.44978L15.542 4.4147Z" stroke="#3b82f6" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
const logoBase64 = `data:image/svg+xml;base64,${btoa(logoSvg)}`;

const Header: React.FC<HeaderProps> = ({ 
  lastUpdated, 
  onRefresh, 
  loading,
  startDate,
  endDate,
  onDateChange,
  hasActiveFilter,
  filters,
  onFilterChange,
  filterOptions
}) => {
  return (
    <header className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <img src={logoBase64} alt="Lion Ads PRO CRM Logo" className="h-10 w-10" />
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Lion Ads PRO CRM</h1>
            </div>
            <div className="flex items-center w-full sm:w-auto justify-end gap-2 sm:gap-4">
                <div className="text-right">
                <p className="text-xs text-text-secondary">Última atualização</p>
                <p className="text-sm font-semibold">{formatDate(lastUpdated)}</p>
                </div>
                <button
                onClick={onRefresh}
                disabled={loading}
                className="p-2 bg-slate-700 rounded-full text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-wait transition-colors"
                aria-label="Atualizar dados"
                >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </div>
        <div className="flex items-center gap-2 border-t border-border pt-4 flex-wrap">
            <FilterMenu 
                startDate={startDate}
                endDate={endDate}
                onDateChange={onDateChange}
                hasActiveFilter={hasActiveFilter}
            />
            <MultiSelectFilter 
              label="Tipo de Negócio"
              options={filterOptions.tipoNegocio}
              selected={filters.tipoNegocio}
              onChange={(selected) => onFilterChange('tipoNegocio', selected)}
            />
             <MultiSelectFilter 
              label="Source"
              options={filterOptions.source}
              selected={filters.source}
              onChange={(selected) => onFilterChange('source', selected)}
            />
             <MultiSelectFilter 
              label="Status"
              options={filterOptions.status}
              selected={filters.status}
              onChange={(selected) => onFilterChange('status', selected)}
            />
        </div>
    </header>
  );
};

export default Header;