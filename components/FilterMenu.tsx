
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

  // Close menu on outside click (for desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Only close if it's not the modal overlay (handled separately)
        if (window.innerWidth >= 640) { // sm breakpoint
             setIsOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Prevent background scroll when modal is open on mobile
  useEffect(() => {
      if (isOpen && window.innerWidth < 640) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'unset';
      }
      return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 bg-card border border-transparent hover:border-border rounded-lg text-text-secondary hover:text-text-main transition-colors w-full sm:w-auto justify-center sm:justify-start ${isOpen ? 'border-brand-blue ring-1 ring-brand-blue' : ''}`}
        aria-label="Abrir filtros"
      >
        <FilterIcon className="h-5 w-5" />
        <span className="font-semibold text-sm">Filtros</span>
        {hasActiveFilter && (
            <span className="h-2 w-2 rounded-full bg-brand-blue ml-1"></span>
        )}
      </button>

      {isOpen && (
        <>
            {/* MOBILE: Fixed Modal Overlay */}
            <div className="fixed inset-0 z-50 sm:hidden flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div 
                    className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
                    style={{ animation: 'fade-in-down 0.2s ease-out' }}
                >
                    <div className="sticky top-0 bg-card z-10 p-4 border-b border-border flex justify-between items-center">
                        <h3 className="text-base font-bold text-text-main">Filtrar Período</h3>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="p-2 -mr-2 rounded-full text-text-secondary hover:text-white hover:bg-slate-700 transition-colors"
                        >
                            <X className="h-5 w-5"/>
                        </button>
                    </div>
                    <div className="p-4">
                        <DateFilter
                            startDate={startDate}
                            endDate={endDate}
                            onDateChange={(range) => {
                                onDateChange(range);
                                // Optional: close on selection if desired, but user might want to custom pick
                                // setIsOpen(false); 
                            }}
                        />
                         <button 
                            onClick={() => setIsOpen(false)}
                            className="w-full mt-4 py-3 bg-brand-blue text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Aplicar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* DESKTOP: Absolute Dropdown */}
            <div 
              className="hidden sm:block absolute left-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-20 p-4"
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
        </>
      )}
    </div>
  );
};

export default FilterMenu;
