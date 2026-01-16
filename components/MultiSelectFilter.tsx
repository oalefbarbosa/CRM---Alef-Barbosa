
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from './Icons';

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  const clearSelection = () => {
    onChange([]);
  };

  const hasActiveFilter = selected.length > 0;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-slate-700 border rounded-md text-sm transition-colors ${hasActiveFilter ? 'border-brand-blue text-text-main' : 'border-border text-text-secondary'}`}
      >
        {label}
        {hasActiveFilter && (
            <span className="bg-brand-blue text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{selected.length}</span>
        )}
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-20"
          style={{ animation: 'fade-in-down 0.2s ease-out' }}
        >
            <div className="p-3 border-b border-border flex justify-between items-center">
                <h4 className="text-sm font-semibold">{label}</h4>
                {hasActiveFilter && (
                    <button onClick={clearSelection} className="text-xs text-brand-blue hover:underline">
                        Limpar
                    </button>
                )}
            </div>
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {options.map(option => (
              <label key={option} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => handleSelect(option)}
                  className="h-4 w-4 rounded bg-slate-600 border-border text-brand-blue focus:ring-brand-blue"
                />
                <span className="text-sm capitalize">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;