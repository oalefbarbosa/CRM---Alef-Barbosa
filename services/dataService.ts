
import { CrmData, CampaignData } from '../types';

// Papa is loaded from CDN, so we declare it globally to satisfy TypeScript
declare const Papa: any;

const CRM_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-lERaYfObkqkv-VJegMHIN1iRoGZ0MXwsilJmMZ2mJ_S_ZWDLe8WxROhZlmgO3auyU8s_iWTDJ3LY/pub?gid=0&single=true&output=csv';
const CAMPAIGN_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-lERaYfObkqkv-VJegMHIN1iRoGZ0MXwsilJmMZ2mJ_S_ZWDLe8WxROhZlmgO3auyU8s_iWTDJ3LY/pub?gid=1439004287&single=true&output=csv';

const parseDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  const parts = dateString.split('/');
  if (parts.length === 3) {
    // DD/MM/YYYY
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  }
  return new Date(dateString); // Fallback for other formats
};

/**
 * Robustly parses a string into a float, handling different locale formats for numbers.
 * @param val The string or number to parse.
 * @returns The parsed number, or 0 if parsing fails.
 */
const cleanAndParseFloat = (val: string | number | null | undefined): number => {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string' || !val) return 0;

    let s = String(val).replace(/R\$\s?/, '').trim();

    // First, handle a common ambiguity: a single type of separator.
    // e.g., is "1.234" a thousand or a decimal?
    const periodIndex = s.lastIndexOf('.');
    const commaIndex = s.lastIndexOf(',');

    if (periodIndex > -1 && commaIndex === -1) {
        // Only periods exist. If the part after the last period has 3 digits,
        // it's highly likely to be a thousand separator.
        if (s.substring(periodIndex + 1).length === 3) {
            s = s.replace(/\./g, ''); // "1.234" becomes "1234"
        }
    }
    if (commaIndex > -1 && periodIndex === -1) {
        // Only commas exist. If the part after the last comma has 3 digits,
        // it's likely a thousand separator.
        if (s.substring(commaIndex + 1).length === 3) {
            s = s.replace(/,/g, ''); // "1,234" becomes "1234"
        }
    }

    // Now, determine the decimal and thousand separators based on the last separator's position.
    let thousand = '.';
    let decimal = ',';
    // Heuristic: if the last separator is a period, assume US-style (e.g., "1,234.56")
    if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
        thousand = ',';
        decimal = '.';
    }

    // Remove all thousand separators
    s = s.replace(new RegExp('\\' + thousand, 'g'), '');
    // Replace the decimal separator with a standard period
    s = s.replace(decimal, '.');
    
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
};


/**
 * Robustly parses a string into an integer by leveraging the float parser and rounding.
 * @param val The string or number to parse.
 * @returns The parsed and rounded number, or 0 if parsing fails.
 */
const cleanAndParseInt = (val: string | number | null | undefined): number => {
    const num = cleanAndParseFloat(val);
    return isNaN(num) ? 0 : Math.round(num);
};


export function loadCRM(): Promise<CrmData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(CRM_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const leads: CrmData[] = results.data.map((row: any, index: number) => ({
          id: row['ID'] || `generated-id-${index}`,
          nome: row['Nome'] || '',
          status: row['Status']?.toLowerCase()?.trim() || 'desconhecido',
          dataCriacao: parseDate(row['Data Criação']),
          dataAtualizacao: parseDate(row['Data Atualização']),
          email: row['Email'] || '',
          telefone: row['Telefone'] || '',
          instagram: row['Instagram'] || '',
          investimentoAds: cleanAndParseFloat(row['Investimento Ads']),
          tipoNegocio: row['Tipo Negócio'] || 'N/A',
          servico: row['Serviço'] || 'N/A',
          prospeccao: row['Prospecção'] || 'N/A',
          temperatura: row['Temperatura']?.toUpperCase()?.trim() || 'N/A',
          followUp: row['FollowUp'] || '',
          motivoPerda: row['Motivo Perda'] || 'N/A',
          valor: cleanAndParseFloat(row['Valor']),
          url: row['URL'] || ''
        }));
        resolve(leads);
      },
      error: (error: any) => reject(error)
    });
  });
}

export function loadCampanhas(): Promise<CampaignData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(CAMPAIGN_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const campanhas: CampaignData[] = results.data.map((row: any) => {
          const nome = row['Nome da campanha'] || '';
          let tipo = 'OUTRO';
          if (nome.toUpperCase().includes('CADASTRO')) tipo = 'CADASTRO';
          else if (nome.toUpperCase().includes('ENGAJAMENTO')) tipo = 'ENGAJAMENTO';
          else if (nome.toUpperCase().includes('CONVERSÃO') || nome.toUpperCase().includes('LEAD')) tipo = 'CONVERSÃO LP';

          let nicho = 'GERAL';
          if (nome.toUpperCase().includes('FOTÓGRAF') || nome.toUpperCase().includes('FOTOGRAFO')) nicho = 'FOTÓGRAFOS';
          else if (nome.toUpperCase().includes('NUTRICIONISTA')) nicho = 'NUTRICIONISTAS';
          
          return {
            dataInicio: parseDate(row['Início dos relatórios']),
            nome: nome,
            tipo: tipo,
            nicho: nicho,
            status: (row['Veiculação da campanha'] || 'N/A').toLowerCase(),
            valorUsado: cleanAndParseFloat(row['Valor usado (BRL)']),
            orcamento: cleanAndParseFloat(row['Orçamento do conjunto de anúncios']),
            alcance: cleanAndParseInt(row['Alcance']),
            frequencia: cleanAndParseFloat(row['Frequência']),
            impressoes: cleanAndParseInt(row['Impressões']),
            cpm: cleanAndParseFloat(row['CPM (custo por 1.000 impressões) (BRL)']),
            cliques: cleanAndParseInt(row['Cliques no link']),
            cpc: cleanAndParseFloat(row['CPC (custo por clique no link) (BRL)']),
            ctr: cleanAndParseFloat(row['CTR (taxa de cliques no link)']),
            conversas: cleanAndParseInt(row['Conversas por mensagem iniciadas']),
            custoConversa: cleanAndParseFloat(row['Custo por conversa por mensagem iniciada (BRL)']),
            leads: cleanAndParseInt(row['Leads']),
            custoLead: cleanAndParseFloat(row['Custo por lead (BRL)']),
            leadFormulario: cleanAndParseInt(row['LEAD FORMULARIO']),
            roas: cleanAndParseFloat(row['Retorno sobre o investimento em publicidade (ROAS) das compras'])
          };
        });
        resolve(campanhas);
      },
      error: (error: any) => reject(error)
    });
  });
}