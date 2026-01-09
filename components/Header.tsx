
import React from 'react';
import { RefreshCw } from './Icons';
import { formatDate } from '../utils/formatters';

interface HeaderProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

const logoBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgNjAiIHdpZHRoPSIyMDAiIGhlaWdodD0iNjAiPgogIDxzdHlsZT4KICAgIC50ZXh0IHsKICAgICAgZm9udC1mYW1pbHk6ICdJbnRlcicsIHNhbnMtc2VyaWY7CiAgICAgIGZvbnQtc2l6ZTogNDhweDsKICAgICAgZm9udC13ZWlnaHQ6IDgwMDsKICAgICAgZmlsbDogI2Y4ZmFmYzsKICAgIH0KICAgIC5oaWdobGlnaHQgewogICAgICBmaWxsOiAjM2I4MmY2OwogICAgfQogIDwvc3R5bGU+CiAgPHRleHQgeD0iMTAiIHk9IjQ1IiBjbGFzcz0idGV4dCI+CiAgICBBPHRzcGFuIGNsYXNzPSJoaWdobGlnaHQiPlI8L3RzcGFuPkMKICA8L3RleHQ+Cjwvc3ZnPg==";

const Header: React.FC<HeaderProps> = ({ lastUpdated, onRefresh, loading }) => {
  return (
    <header className="flex flex-col sm:flex-row items-center justify-between mb-6">
      <div className="flex items-center">
        <img src={logoBase64} alt="Dashboard Logo" className="h-10 mr-3" />
        <h1 className="text-3xl font-bold text-slate-100">CRM & Campanhas</h1>
      </div>
      <div className="flex items-center mt-4 sm:mt-0">
        <div className="text-right mr-4">
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
    </header>
  );
};

export default Header;