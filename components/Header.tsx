
import React from 'react';
import { RefreshCw, Sun, Moon, LayoutGrid } from './Icons';
import { formatDate } from '../utils/formatters';
import FilterMenu from './FilterMenu';
import MultiSelectFilter from './MultiSelectFilter';
import { Theme } from '../types';

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
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSidebar: () => void;
}

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
  filterOptions,
  theme,
  onToggleTheme,
  onOpenSidebar
}) => {
  return (
    <header className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button 
                  onClick={onOpenSidebar}
                  className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-main"
                  aria-label="Menu"
                >
                  <LayoutGrid className="h-6 w-6" />
                </button>

                {/* Page Title (Since logo is in sidebar now) */}
                <div className="block">
                     <h2 className="text-xl sm:text-2xl font-bold text-text-main leading-tight">Dashboard CRM</h2>
                     <p className="text-xs text-text-secondary">Performance & Controle</p>
                </div>
            </div>
            
            <div className="flex flex-row-reverse md:flex-row items-center justify-between md:justify-end gap-3 sm:gap-4 w-full md:w-auto">
                 <button
                    onClick={onToggleTheme}
                    className="p-2 bg-card border border-border rounded-full text-text-secondary hover:text-text-main hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue transition-colors"
                    aria-label="Alternar tema"
                    title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                 >
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                 </button>

                 <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="p-2 bg-card border border-border rounded-full text-text-secondary hover:text-text-main hover:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-wait transition-colors"
                    aria-label="Atualizar dados"
                >
                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <div className="text-left md:text-right">
                    <p className="text-[10px] sm:text-xs text-text-secondary">Última atualização</p>
                    <p className="text-xs sm:text-sm font-semibold text-text-main">{formatDate(lastUpdated)}</p>
                </div>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <div className="w-full sm:w-auto">
                <FilterMenu 
                    startDate={startDate}
                    endDate={endDate}
                    onDateChange={onDateChange}
                    hasActiveFilter={hasActiveFilter}
                />
            </div>
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
