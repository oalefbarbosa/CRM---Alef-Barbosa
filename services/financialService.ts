
export interface FinancialTransaction {
  tipo: 'Entrada' | 'Saída';
  data: string;
  categoria: string;
  cliente_projeto: string;
  descricao: string;
  valor: number;
  status: string;
  forma_pagamento?: string;
  recorrente?: boolean;
  competencia?: string;
  observacoes?: string;
}

const WEBHOOK_URL = 'https://n8n.iatrafego.com/webhook/financeiro-arc';

export const sendFinancialTransaction = async (data: FinancialTransaction): Promise<boolean> => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return true;
    } else {
      console.error('Failed to send financial transaction:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error sending financial transaction:', error);
    return false;
  }
};
