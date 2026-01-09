
import React, { useState, useRef, useEffect } from 'react';
import { Filter as FilterIcon, X } from './Icons';
import DateFilter from './DateFilter';

interface FilterMenuProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (range: { startDate: Date | null; endDate: Date | null }) => void;
  hasActiveFilter: boolean;
}

const FilterMenu: React.FC<FilterMenuProps> = ({ startDate, endDate, onDateChange, hasActiveFilter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-card border border-transparent hover:border-border rounded-lg text-text-secondary hover:text-text-main transition-colors"
        aria-label="Abrir filtros"
      >
        <FilterIcon className="h-5 w-5" />
        <span className="font-semibold text-sm hidden sm:inline">Filtros</span>
        {hasActiveFilter && (
            <span className="h-2 w-2 rounded-full bg-brand-blue"></span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-72 bg-card border border-border rounded-xl shadow-2xl z-20 p-4"
          style={{ animation: 'fade-in-down 0.2s ease-out' }}
        >
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-text-main">Filtrar Período</h3>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-full text-text-secondary hover:text-text-main hover:bg-slate-700 transition-colors">
                  <X className="h-5 w-5"/>
              </button>
          </div>
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            onDateChange={onDateChange}
          />
        </div>
      )}
    </div>
  );
};

export default FilterMenu;