
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
        const now = new Date();
        let start = new Date(now);
        let end = new Date(now);
        
        // Ensure end of day for the end date (default to today end)
        end.setHours(23, 59, 59, 999);
        // Ensure start of day for default start date (default to today start)
        start.setHours(0, 0, 0, 0);

        switch (preset) {
            case 'today':
                // Start is already today 00:00
                break;
            case 'yesterday':
                start.setDate(now.getDate() - 1);
                end.setDate(now.getDate() - 1);
                end.setHours(23, 59, 59, 999);
                break;
            case 'this_week':
                // Assuming week starts on Sunday.
                const day = now.getDay(); 
                const diff = now.getDate() - day; 
                start.setDate(diff);
                break;
            case 'last_7_days':
                start.setDate(now.getDate() - 6);
                break;
            case 'this_month':
                start.setDate(1);
                break;
            case 'last_month':
                 // First day of previous month
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                // Last day of previous month
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'last_90_days':
                start.setDate(now.getDate() - 89);
                break;
            case 'last_180_days':
                start.setDate(now.getDate() - 179);
                break;
            case 'this_year':
                start.setMonth(0, 1); // Jan 1st
                break;
            case 'last_year':
                start = new Date(now.getFullYear() - 1, 0, 1);
                end = new Date(now.getFullYear() - 1, 11, 31);
                end.setHours(23, 59, 59, 999);
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
            className="w-full text-center px-2 py-2 text-xs font-medium text-text-secondary bg-bg-subtle hover:bg-brand-blue hover:text-white border border-border rounded-lg transition-all truncate"
            title={label}
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
                    value={value ? toYYYYMMDD(value) : ''} 
                    onChange={onChange} 
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-full pl-9 appearance-none focus:ring-1 focus:ring-brand-blue focus:border-brand-blue text-text-main"
                />
                <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none"/>
            </div>
       </div>
    );
    
    return (
        <div className="space-y-5">
            <div>
                <p className="text-xs font-bold text-text-secondary uppercase mb-3">Períodos Rápidos</p>
                <div className="grid grid-cols-2 gap-2">
                    <PresetButton label="Hoje" preset="today" />
                    <PresetButton label="Ontem" preset="yesterday" />
                    <PresetButton label="Esta Semana" preset="this_week" />
                    <PresetButton label="Últimos 7 dias" preset="last_7_days" />
                    <PresetButton label="Este Mês" preset="this_month" />
                    <PresetButton label="Mês Passado" preset="last_month" />
                    <PresetButton label="Últimos 90 dias" preset="last_90_days" />
                    <PresetButton label="Últimos 180 dias" preset="last_180_days" />
                    <PresetButton label="Este Ano" preset="this_year" />
                    <PresetButton label="Ano Passado" preset="last_year" />
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
