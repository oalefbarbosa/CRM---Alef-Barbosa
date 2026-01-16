
import { CrmData, CampaignData } from '../types';

// Papa is loaded from CDN, so we declare it globally to satisfy TypeScript
declare const Papa: any;

const CRM_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-lERaYfObkqkv-VJegMHIN1iRoGZ0MXwsilJmMZ2mJ_S_ZWDLe8WxROhZlmgO3auyU8s_iWTDJ3LY/pub?gid=0&single=true&output=csv';
const CAMPAIGN_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-lERaYfObkqkv-VJegMHIN1iRoGZ0MXwsilJmMZ2mJ_S_ZWDLe8WxROhZlmgO3auyU8s_iWTDJ3LY/pub?gid=1439004287&single=true&output=csv';

const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('/');
  if (parts.length === 3) {
    // DD/MM/YYYY
    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    return isNaN(date.getTime()) ? null : date;
  }
  const parsedDate = new Date(dateString);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
};


const cleanAndParseFloat = (val: string | number | null | undefined): number => {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string' || !val) return 0;

    let s = String(val).replace(/R\$\s?/, '').trim();

    const periodIndex = s.lastIndexOf('.');
    const commaIndex = s.lastIndexOf(',');

    if (periodIndex > -1 && commaIndex > -1) { // 1.234,56 or 1,234.56
        if (commaIndex > periodIndex) { // 1.234,56
            s = s.replace(/\./g, '').replace(',', '.');
        } else { // 1,234.56
            s = s.replace(/,/g, '');
        }
    } else if (commaIndex > -1) { // 1234,56 or 1,234
        if (s.length - 1 - commaIndex === 3 && s.indexOf(',') !== s.length - 4) { // Likely 1,234
             s = s.replace(/,/g, '');
        } else { // 1234,56
            s = s.replace(',', '.');
        }
    }
    
    const num = parseFloat(s);
    return isNaN(num) ? 0 : num;
};


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
        if (results.errors.length > 0) {
          console.error("CSV Parsing Errors:", results.errors);
        }
        const leads: CrmData[] = results.data.map((row: any, index: number) => ({
          id: row['ID'] || `generated-id-${index}`,
          nome: row['Nome'] || 'Lead sem nome',
          status: (row['Status'] || 'leads').toLowerCase().trim(),
          dataCriacao: parseDate(row['Data Criação']) || new Date(),
          dataAtualizacao: parseDate(row['Data Atualização'] || row['Data Criação']) || new Date(),
          dataFechamento: parseDate(row['data de fechame']),
          responsavel: row['Responsável'] || 'N/A',
          email: row['Email'] || '',
          telefone: row['Telefone'] || '',
          instagram: row['Instagram'] || '',
          investimentoAds: cleanAndParseFloat(row['Investimento em Ads']),
          tipoNegocio: row['Tipo Negócio'] || 'N/A',
          servico: row['Serviço'] || 'N/A',
          prospeccao: row['Prospecção'] || 'Não abordado',
          temperatura: (row['Temperatura'] || 'FRIO').toUpperCase().trim(),
          followUp: row['FollowUp'] || 'Proposta Enviada',
          motivoPerda: row['Motivo Perda'] || 'N/A',
          valor: cleanAndParseFloat(row['Valor']),
          url: row['URL'] || '',
          source: row['Source'] || 'N/A',
          campaign: row['Campaign'] || 'N/A',
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
        if (results.errors.length > 0) {
            console.error("Campaign CSV Parsing Errors:", results.errors);
        }
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
            dataInicio: parseDate(row['Início dos relatórios']) || new Date(),
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