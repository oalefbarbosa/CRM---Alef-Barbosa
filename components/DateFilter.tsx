
import React from 'react';
import { CalendarDays, X } from './Icons';
import { toYYYYMMDD } from '../utils/formatters';

interface DateFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateChange: (range: { startDate: Date | null; endDate: Date | null }) => void;
}

const DateFilter: React.FC<DateFilterProps> = ({ startDate, endDate, onDateChange }) => {
    
    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDateChange({ startDate: e.target.value ? new Date(e.target.value + 'T00:00:00') : null, endDate });
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDateChange({ startDate, endDate: e.target.value ? new Date(e.target.value + 'T00:00:00') : null });
    };

    const setRange = (start: Date, end: Date) => {
        onDateChange({ startDate: start, endDate: end });
    };

    const handlePreset = (preset: string) => {
        const end = new Date();
        const start = new Date();
        
        // Ensure end of day for the end date
        end.setHours(23, 59, 59, 999);
        // Ensure start of day for default start date
        start.setHours(0, 0, 0, 0);

        switch (preset) {
            case 'today':
                // Start is already today 00:00
                break;
            case 'yesterday':
                start.setDate(start.getDate() - 1);
                end.setDate(end.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_week':
                // Assuming week starts on Sunday. If today is Sunday (0), we go back 0 days.
                const day = start.getDay(); 
                const diff = start.getDate() - day; 
                start.setDate(diff);
                break;
            case 'last_7_days':
                start.setDate(start.getDate() - 6);
                break;
            case 'last_30_days':
                start.setDate(start.getDate() - 29);
                break;
            case 'last_60_days':
                start.setDate(start.getDate() - 59);
                break;
            case 'last_90_days':
                start.setDate(start.getDate() - 89);
                break;
            case 'last_180_days':
                start.setDate(start.getDate() - 179);
                break;
            case 'this_year':
                start.setMonth(0, 1); // Jan 1st
                break;
        }
        setRange(start, end);
    };
    
    const clearFilters = () => {
        onDateChange({ startDate: null, endDate: null });
    };

    const PresetButton = ({ label, preset }: { label: string, preset: string }) => (
        <button 
            onClick={() => handlePreset(preset)} 
            className="w-full text-center px-2 py-2 text-xs font-medium text-text-secondary bg-slate-700/50 hover:bg-brand-blue hover:text-white border border-border rounded-lg transition-all"
        >
            {label}
        </button>
    );

    const DateInput: React.FC<{label: string, value: Date | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({ label, value, onChange }) => (
       <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">{label}</label>
            <div className="relative">
                <input 
                    type="date" 
                    value={toYYYYMMDD(value)} 
                    onChange={onChange} 
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-full pl-9 appearance-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue"
                />
                <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none"/>
            </div>
       </div>
    );
    
    return (
        <div className="space-y-5">
            <div>
                <p className="text-xs font-bold text-text-secondary uppercase mb-3">Períodos Rápidos</p>
                <div className="grid grid-cols-3 gap-2">
                    <PresetButton label="Hoje" preset="today" />
                    <PresetButton label="Ontem" preset="yesterday" />
                    <PresetButton label="Esta Sem." preset="this_week" />
                    <PresetButton label="7 dias" preset="last_7_days" />
                    <PresetButton label="30 dias" preset="last_30_days" />
                    <PresetButton label="60 dias" preset="last_60_days" />
                    <PresetButton label="90 dias" preset="last_90_days" />
                    <PresetButton label="180 dias" preset="last_180_days" />
                    <PresetButton label="Este Ano" preset="this_year" />
                </div>
            </div>

            <div className="pt-2 border-t border-border">
                 <p className="text-xs font-bold text-text-secondary uppercase mb-3">Personalizado</p>
                 <div className="grid grid-cols-2 gap-3">
                    <DateInput label="De" value={startDate} onChange={handleStartDateChange} />
                    <DateInput label="Até" value={endDate} onChange={handleEndDateChange} />
                 </div>
            </div>
           
            {(startDate || endDate) && (
                <button 
                  onClick={clearFilters} 
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors"
                  aria-label="Limpar filtros"
                >
                    <X className="h-4 w-4"/>
                    <span>Limpar Período</span>
                </button>
            )}
        </div>
    );
};
export default DateFilter;
