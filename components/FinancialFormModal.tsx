
import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle } from './Icons';
import { sendFinancialTransaction, FinancialTransaction } from '../services/financialService';

interface FinancialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES_ENTRADA = [
  "Mensalidade Clientes", "Comissão sobre Ads", "Projetos Pontuais", "LAKS", 
  "Storymaker", "Bônus Performance", "Outros Entrada"
];

const CATEGORIES_SAIDA = [
  "Ferramentas e SaaS", "Impostos e Taxas", "Marketing Próprio", 
  "Equipe e Terceiros", "Educação", "Infraestrutura", "Pró-labore", 
  "Reserva Financeira", "Outros Saída"
];

const FinancialFormModal: React.FC<FinancialFormModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FinancialTransaction>({
    tipo: 'Entrada',
    data: new Date().toISOString().split('T')[0],
    categoria: CATEGORIES_ENTRADA[0],
    cliente_projeto: '',
    descricao: '',
    valor: 0,
    status: 'Pago',
    forma_pagamento: '',
    recorrente: false,
    competencia: '',
    observacoes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, recorrente: e.target.checked }));
  };

  const handleTypeChange = (type: 'Entrada' | 'Saída') => {
    setFormData(prev => ({
      ...prev,
      tipo: type,
      categoria: type === 'Entrada' ? CATEGORIES_ENTRADA[0] : CATEGORIES_SAIDA[0]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Explicit client-side validation
    if (!formData.cliente_projeto || !formData.descricao || !formData.valor || Number(formData.valor) <= 0) {
      setError('Por favor, preencha os campos obrigatórios (*): Cliente/Projeto, Descrição e Valor (deve ser maior que zero).');
      return;
    }

    setLoading(true);
    
    const transaction = {
        ...formData,
        valor: Number(formData.valor) // Ensure number
    };

    const result = await sendFinancialTransaction(transaction);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // Reset form
        setFormData({
            tipo: 'Entrada',
            data: new Date().toISOString().split('T')[0],
            categoria: CATEGORIES_ENTRADA[0],
            cliente_projeto: '',
            descricao: '',
            valor: 0,
            status: 'Pago',
            forma_pagamento: '',
            recorrente: false,
            competencia: '',
            observacoes: ''
        });
      }, 2000);
    } else {
      setError(result.error || 'Erro ao registrar lançamento. Tente novamente.');
    }
    setLoading(false);
  };

  const activeCategories = formData.tipo === 'Entrada' ? CATEGORIES_ENTRADA : CATEGORIES_SAIDA;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in-down">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-main">Novo Lançamento Financeiro</h2>
          <button onClick={onClose} className="p-2 rounded-full text-text-secondary hover:bg-bg-subtle transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <CheckCircle className="h-20 w-20 text-brand-green mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-text-main">Lançamento Registrado!</h3>
            <p className="text-text-secondary">Os dados foram enviados com sucesso.</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex items-center gap-3 text-red-500 text-sm">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Type Switcher */}
            <div className="grid grid-cols-2 bg-bg-subtle p-1 rounded-lg">
                <button
                    type="button"
                    onClick={() => handleTypeChange('Entrada')}
                    className={`py-2 px-4 rounded-md font-bold transition-all ${formData.tipo === 'Entrada' ? 'bg-brand-green text-white shadow' : 'text-text-secondary hover:text-text-main'}`}
                >
                    Entrada
                </button>
                <button
                    type="button"
                    onClick={() => handleTypeChange('Saída')}
                    className={`py-2 px-4 rounded-md font-bold transition-all ${formData.tipo === 'Saída' ? 'bg-brand-red text-white shadow' : 'text-text-secondary hover:text-text-main'}`}
                >
                    Saída
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Data *</label>
                    <input 
                        type="date" 
                        name="data" 
                        required
                        value={formData.data} 
                        onChange={handleInputChange} 
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                </div>

                {/* Value */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Valor (R$) *</label>
                    <input 
                        type="number" 
                        step="0.01"
                        name="valor" 
                        required
                        min="0"
                        placeholder="0,00"
                        value={formData.valor || ''} 
                        onChange={handleInputChange} 
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Categoria *</label>
                    <select 
                        name="categoria" 
                        required
                        value={formData.categoria} 
                        onChange={handleInputChange} 
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                        {activeCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Status *</label>
                    <select 
                        name="status" 
                        required
                        value={formData.status} 
                        onChange={handleInputChange} 
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                        <option value="Pago">Pago</option>
                        <option value="A pagar">A pagar</option>
                        <option value="A receber">A receber</option>
                        <option value="Atrasado">Atrasado</option>
                    </select>
                </div>

                 {/* Cliente/Projeto */}
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Cliente / Projeto *</label>
                    <input 
                        type="text" 
                        name="cliente_projeto" 
                        required
                        placeholder="Ex: LAKS, Campanha X..."
                        value={formData.cliente_projeto} 
                        onChange={handleInputChange} 
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                </div>

                {/* Descrição */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Descrição *</label>
                    <input 
                        type="text" 
                        name="descricao" 
                        required
                        placeholder="Ex: Mensalidade referente a Janeiro"
                        value={formData.descricao} 
                        onChange={handleInputChange} 
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                </div>

                {/* Payment Method */}
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Forma de Pagamento</label>
                    <select 
                        name="forma_pagamento" 
                        value={formData.forma_pagamento} 
                        onChange={handleInputChange} 
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                        <option value="">Selecione...</option>
                        <option value="Pix">Pix</option>
                        <option value="Boleto">Boleto</option>
                        <option value="Transferência">Transferência</option>
                        <option value="Cartão Crédito">Cartão Crédito</option>
                        <option value="Cartão Débito">Cartão Débito</option>
                        <option value="Dinheiro">Dinheiro</option>
                    </select>
                </div>

                 {/* Competence */}
                 <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Competência (Mês)</label>
                    <input 
                        type="text" 
                        name="competencia" 
                        placeholder="Ex: Janeiro"
                        value={formData.competencia} 
                        onChange={handleInputChange} 
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                </div>

                 {/* Recurrent */}
                <div className="md:col-span-2 flex items-center gap-3 p-3 border border-border rounded-lg bg-bg-subtle/50">
                    <input 
                        type="checkbox" 
                        id="recorrente"
                        name="recorrente" 
                        checked={formData.recorrente} 
                        onChange={handleCheckboxChange} 
                        className="h-5 w-5 rounded bg-background border-border text-brand-blue focus:ring-brand-blue"
                    />
                    <label htmlFor="recorrente" className="text-sm font-medium text-text-main cursor-pointer">
                        É um lançamento recorrente? (Assinatura, Mensalidade)
                    </label>
                </div>

                {/* Observations */}
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-secondary mb-1">Observações</label>
                    <textarea 
                        name="observacoes" 
                        rows={2}
                        value={formData.observacoes} 
                        onChange={handleInputChange} 
                        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
                    />
                </div>

            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button 
                    type="button" 
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text-main hover:bg-bg-subtle rounded-lg transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2 text-sm font-bold text-white bg-brand-blue hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Salvando...' : 'Salvar Lançamento'}
                </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FinancialFormModal;
