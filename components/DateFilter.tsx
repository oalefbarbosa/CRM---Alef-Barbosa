
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
        const dateStr = e.target.value;
        if (!dateStr) {
            onDateChange({ startDate: null, endDate });
            return;
        }
        const [year, month, day] = dateStr.split('-').map(Number);
        onDateChange({ startDate: new Date(Date.UTC(year, month - 1, day)), endDate });
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateStr = e.target.value;
        if (!dateStr) {
            onDateChange({ startDate, endDate: null });
            return;
        }
        const [year, month, day] = dateStr.split('-').map(Number);
        onDateChange({ startDate, endDate: new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)) });
    };

    const setRange = (start: Date, end: Date) => {
        onDateChange({ startDate: start, endDate: end });
    };

    const handlePreset = (preset: string) => {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth();
        const day = now.getUTCDate();
        let start: Date;
        let end: Date;

        switch (preset) {
            case 'today':
                start = new Date(Date.UTC(year, month, day));
                end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
                break;
            case 'yesterday':
                start = new Date(Date.UTC(year, month, day - 1));
                end = new Date(Date.UTC(year, month, day - 1, 23, 59, 59, 999));
                break;
            case 'this_week':
                const dayOfWeek = now.getUTCDay(); // Sunday = 0
                start = new Date(Date.UTC(year, month, day - dayOfWeek));
                end = new Date(Date.UTC(year, month, day + (6 - dayOfWeek), 23, 59, 59, 999));
                break;
            case 'last_7_days':
                start = new Date(Date.UTC(year, month, day - 6));
                end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
                break;
            case 'this_month':
                start = new Date(Date.UTC(year, month, 1));
                end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
                break;
            case 'last_month':
                start = new Date(Date.UTC(year, month - 1, 1));
                end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
                break;
            case 'last_90_days':
                start = new Date(Date.UTC(year, month, day - 89));
                end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
                break;
            case 'last_180_days':
                start = new Date(Date.UTC(year, month, day - 179));
                end = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
                break;
            case 'this_year':
                start = new Date(Date.UTC(year, 0, 1));
                end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
                break;
            case 'last_year':
                start = new Date(Date.UTC(year - 1, 0, 1));
                end = new Date(Date.UTC(year - 1, 11, 31, 23, 59, 59, 999));
                break;
            default:
                start = new Date(Date.UTC(year, month, 1));
                end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
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