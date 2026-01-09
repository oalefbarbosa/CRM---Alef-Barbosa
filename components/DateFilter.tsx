
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
        let start = new Date();
        
        end.setHours(23, 59, 59, 999);

        switch (preset) {
            case 'last_7_days':
                start.setDate(end.getDate() - 6);
                start.setHours(0, 0, 0, 0);
                break;
            case 'last_30_days':
                start.setDate(end.getDate() - 29);
                start.setHours(0, 0, 0, 0);
                break;
            case 'this_month':
                start = new Date(end.getFullYear(), end.getMonth(), 1);
                start.setHours(0, 0, 0, 0);
                break;
            case 'last_60_days':
                start.setDate(end.getDate() - 59);
                start.setHours(0, 0, 0, 0);
                break;
            case 'last_90_days':
                start.setDate(end.getDate() - 89);
                start.setHours(0, 0, 0, 0);
                break;
            case 'last_180_days':
                start.setDate(end.getDate() - 179);
                start.setHours(0, 0, 0, 0);
                break;
        }
        setRange(start, end);
    };
    
    const clearFilters = () => {
        onDateChange({ startDate: null, endDate: null });
    };

    const PresetButton = ({ label, preset }: { label: string, preset: string }) => (
        <button onClick={() => handlePreset(preset)} className="w-full text-center px-3 py-2 text-sm text-text-secondary bg-slate-700 hover:bg-slate-600 rounded-md transition-colors whitespace-nowrap">
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
                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-full pl-9 appearance-none"
                />
                <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none"/>
            </div>
       </div>
    );
    
    return (
        <div className="space-y-4">
            <div>
                <p className="text-xs font-medium text-text-secondary mb-2">Predefinições</p>
                <div className="grid grid-cols-3 gap-2">
                    <PresetButton label="7 dias" preset="last_7_days" />
                    <PresetButton label="30 dias" preset="last_30_days" />
                    <PresetButton label="Este Mês" preset="this_month" />
                    <PresetButton label="60 dias" preset="last_60_days" />
                    <PresetButton label="90 dias" preset="last_90_days" />
                    <PresetButton label="180 dias" preset="last_180_days" />
                </div>
            </div>

            <div>
                 <p className="text-xs font-medium text-text-secondary mb-2">Intervalo customizado</p>
                 <div className="space-y-2">
                    <DateInput label="Data de Início" value={startDate} onChange={handleStartDateChange} />
                    <DateInput label="Data de Fim" value={endDate} onChange={handleEndDateChange} />
                 </div>
            </div>
           
            {(startDate || endDate) && (
                <button 
                  onClick={clearFilters} 
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors"
                  aria-label="Limpar filtros"
                >
                    <X className="h-4 w-4"/>
                    <span>Limpar Filtro</span>
                </button>
            )}
        </div>
    );
};
export default DateFilter;
