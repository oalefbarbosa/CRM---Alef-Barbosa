
import React, { useState, useMemo } from 'react';
import { CrmData } from '../../types';
import { formatCurrency, formatDateSimple } from '../../utils/formatters';
import { Flame, Thermometer, Snowflake } from '../Icons';

interface LeadsTableProps {
  data: CrmData[];
  loading: boolean;
}

const statusColorMap: { [key: string]: string } = {
  'ganho': 'bg-green-500/20 text-green-400',
  'perdido': 'bg-red-500/20 text-red-400',
  'em prospecção': 'bg-blue-500/20 text-blue-400',
  'reunião de proposta': 'bg-purple-500/20 text-purple-400',
  'em follow up': 'bg-orange-500/20 text-orange-400',
  'leads': 'bg-slate-500/20 text-slate-400',
};

const getTemperatureIcon = (temp: string) => {
  switch (temp) {
    case 'QUENTE':
      return <Flame className="h-5 w-5 text-red-500" />;
    case 'MORNO':
      return <Thermometer className="h-5 w-5 text-orange-500" />;
    case 'FRIO':
      return <Snowflake className="h-5 w-5 text-blue-500" />;
    default:
      return null;
  }
};

const LeadsTable: React.FC<LeadsTableProps> = ({ data, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredData = useMemo(() => {
    return data.filter(lead =>
      lead.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const TableSkeleton = () => (
    <div className="animate-pulse">
      {[...Array(itemsPerPage)].map((_, i) => (
        <div key={i} className="grid grid-cols-7 gap-4 items-center py-4 border-b border-border">
            <div className="h-4 bg-slate-700 rounded col-span-1"></div>
            <div className="h-4 bg-slate-700 rounded col-span-1"></div>
            <div className="h-4 bg-slate-700 rounded col-span-1"></div>
            <div className="h-4 bg-slate-700 rounded col-span-1"></div>
            <div className="h-4 bg-slate-700 rounded col-span-1"></div>
            <div className="h-4 bg-slate-700 rounded col-span-1"></div>
            <div className="h-4 bg-slate-700 rounded col-span-1"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-6">
      <input
        type="text"
        placeholder="Buscar por nome..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        className="w-full max-w-xs bg-background border border-border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-blue"
      />
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="grid grid-cols-7 gap-4 text-xs font-bold text-text-secondary uppercase px-4 py-2">
            <div>Nome</div>
            <div>Status</div>
            <div>Tipo Negócio</div>
            <div className="text-center">Temp.</div>
            <div>Prospecção</div>
            <div className="text-right">Valor</div>
            <div className="text-right">Data Criação</div>
          </div>
          <div className="text-sm text-text-main">
            {loading ? <TableSkeleton /> : paginatedData.map(lead => (
              <div key={lead.id} className="grid grid-cols-7 gap-4 items-center py-4 px-4 border-t border-border hover:bg-slate-800/50 transition-colors">
                <div className="font-semibold truncate">{lead.nome}</div>
                <div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${statusColorMap[lead.status] || 'bg-gray-500/20 text-gray-400'}`}>
                    {lead.status}
                  </span>
                </div>
                <div className="truncate">{lead.tipoNegocio}</div>
                <div className="flex justify-center">{getTemperatureIcon(lead.temperatura)}</div>
                <div>{lead.prospeccao}</div>
                <div className="text-right font-mono">{formatCurrency(lead.valor)}</div>
                <div className="text-right font-mono">{formatDateSimple(lead.dataCriacao)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
       <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-text-secondary">
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadsTable;
