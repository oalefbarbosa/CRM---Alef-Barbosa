
import React, { useState } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, Wallet } from './Icons';
import FinancialFormModal from './FinancialFormModal';
import KpiCard from './KpiCard';

const FinancialView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in-down">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-card border border-border p-6 rounded-xl shadow-sm gap-4">
        <div>
            <h2 className="text-2xl font-bold text-text-main">Gestão Financeira</h2>
            <p className="text-text-secondary">Controle de entradas, saídas e fluxo de caixa da ARC.</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand-blue hover:bg-blue-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-brand-blue/30 transform hover:-translate-y-0.5"
        >
            <Plus className="h-5 w-5" />
            <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Dashboard Placeholders (Since we don't fetch financial data yet) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Static placeholders to show UI structure */}
          <div className="bg-card border border-border p-5 rounded-xl shadow-lg opacity-80">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-secondary">Receita Mensal</p>
                <div className="h-8 w-8 text-brand-green"><TrendingUp className="h-full w-full"/></div>
            </div>
            <p className="text-3xl font-extrabold text-text-main mt-2">R$ --</p>
            <p className="text-xs text-text-secondary mt-1">Aguardando dados...</p>
          </div>

           <div className="bg-card border border-border p-5 rounded-xl shadow-lg opacity-80">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-secondary">Despesas Mensais</p>
                <div className="h-8 w-8 text-brand-red"><TrendingDown className="h-full w-full"/></div>
            </div>
            <p className="text-3xl font-extrabold text-text-main mt-2">R$ --</p>
             <p className="text-xs text-text-secondary mt-1">Aguardando dados...</p>
          </div>

           <div className="bg-card border border-border p-5 rounded-xl shadow-lg opacity-80">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-secondary">Saldo Atual</p>
                <div className="h-8 w-8 text-brand-blue"><Wallet className="h-full w-full"/></div>
            </div>
            <p className="text-3xl font-extrabold text-text-main mt-2">R$ --</p>
             <p className="text-xs text-text-secondary mt-1">Aguardando dados...</p>
          </div>

           <div className="bg-card border border-border p-5 rounded-xl shadow-lg opacity-80">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-secondary">Lucro Líquido</p>
                <div className="h-8 w-8 text-brand-purple"><DollarSign className="h-full w-full"/></div>
            </div>
            <p className="text-3xl font-extrabold text-text-main mt-2">R$ --</p>
             <p className="text-xs text-text-secondary mt-1">Aguardando dados...</p>
          </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 text-center text-text-secondary">
            <p>Os dados financeiros são enviados para o sistema, mas a visualização do histórico ainda está em desenvolvimento.</p>
            <p className="text-sm mt-2">Utilize o botão acima para registrar novas movimentações.</p>
      </div>

      {/* Modal Form */}
      <FinancialFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default FinancialView;
