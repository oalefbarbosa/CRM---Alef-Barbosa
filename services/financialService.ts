
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

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwX-t0BMvwgPFLuffooVSMyt0zNUlFesimK7uVeOg8_ctHl0H4OHlaA4WJVnNi906lZ/exec';

export const sendFinancialTransaction = async (data: FinancialTransaction): Promise<{ success: boolean; error?: string }> => {
  // Defensive payload construction to ensure all fields are present,
  // correctly typed, and work with potentially outdated script versions.
  const now = new Date();
  const payload = {
    tipo: data.tipo,
    data: data.data,
    categoria: data.categoria,
    cliente_projeto: data.cliente_projeto,
    descricao: data.descricao,
    valor: Number(data.valor) || 0,
    status: data.status,
    forma_pagamento: data.forma_pagamento || '',
    recorrente: data.recorrente || false,
    competencia: data.competencia || '',
    observacoes: data.observacoes || '',
    // Add Ano and Criado_em. If the deployed script is the latest one,
    // it will ignore these and generate its own. If it's an older version,
    // it will use these, fixing the issue of missing data.
    ano: now.getFullYear().toString(),
    criado_em: now.toISOString(),
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        // Sending as 'text/plain' can help avoid CORS preflight (OPTIONS) requests.
        // The Apps Script's `JSON.parse(e.postData.contents)` will still work correctly.
        'Content-Type': 'text/plain;charset=utf-8',
      },
      mode: 'cors', // Explicitly set mode for clarity
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to send financial transaction (server error):', response.status, response.statusText, errorText);
        return { 
          success: false, 
          error: `Erro ${response.status}: ${errorText || response.statusText || 'O servidor da planilha retornou um erro.'}` 
        };
    }

    // The script returns a JSON response indicating success or failure.
    const result = await response.json();

    // Backward compatibility: handle both new format {success: true} and old format {status: "success"}
    if (result && (result.success === true || result.status === 'success')) {
      return { success: true };
    } else {
      // Backward compatibility: handle both new error format {error: "..."} and old format {message: "..."}
      const errorMessage = result.error || result.message || 'O script retornou um erro desconhecido.';
      console.error('Failed to send financial transaction (script error):', errorMessage, 'Full response:', JSON.stringify(result));
      return { 
        success: false, 
        error: `Erro na planilha: ${errorMessage}` 
      };
    }
  } catch (error) {
    console.error('Error sending financial transaction (network/CORS):', error);
    return { 
      success: false, 
      error: 'Erro de conexão com a planilha. Verifique se o script foi implantado com a permissão "Qualquer pessoa" para acesso e a conexão com a internet.' 
    };
  }
};
