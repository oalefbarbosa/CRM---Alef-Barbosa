
import { FunnelConfig, ScenarioSetting } from '../types';

// Papa is loaded from CDN, so we declare it globally to satisfy TypeScript
declare const Papa: any;

// =======================================================================================
// O URL do CSV para carregar as configurações foi adicionado abaixo.
// =======================================================================================
const CONFIG_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT-lERaYfObkqkv-VJegMHIN1iRoGZ0MXwsilJmMZ2mJ_S_ZWDLe8WxROhZlmgO3auyU8s_iWTDJ3LY/pub?gid=496037911&single=true&output=csv';

// =======================================================================================
// O URL do script de salvamento foi adicionado abaixo.
// =======================================================================================
const SAVE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxdnqlgoEfT5I_Qdpo7d6bz18H5dgE60pkOeRadj4MFQ-9poBunyh10g762kKAzBFSD/exec';


export type ConfigMap = Map<string, FunnelConfig | ScenarioSetting[]>;

/**
 * Loads all configurations from the 'Config' Google Sheet.
 * @returns A Map where keys are config keys (e.g., 'funnel_config_2024') and values are the parsed config objects.
 */
export const loadConfig = (): Promise<ConfigMap> => {
  return new Promise((resolve, reject) => {
    if (!CONFIG_SHEET_URL || CONFIG_SHEET_URL.includes('COLE_AQUI')) {
        console.warn("URL da planilha de configuração não definida. Usando valores padrão.");
        return resolve(new Map());
    }
    
    Papa.parse(CONFIG_SHEET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const configMap: ConfigMap = new Map();
        if (results.data && results.data.length > 0) {
          results.data.forEach((row: { key: string, value: string }) => {
            if (row.key && row.value) {
              try {
                configMap.set(row.key, JSON.parse(row.value));
              } catch (e) {
                console.error(`Falha ao analisar a configuração para a chave "${row.key}":`, e);
              }
            }
          });
        }
        resolve(configMap);
      },
      error: (error: any) => {
        console.error("Erro ao carregar configurações da planilha:", error);
        reject(error);
      },
    });
  });
};

/**
 * Saves a specific configuration to the Google Sheet via Apps Script.
 * @param key The unique key for the configuration (e.g., 'funnel_config_2024').
 * @param value The configuration object to save.
 * @returns A promise indicating success or failure.
 */
export const saveConfig = async (key: string, value: object): Promise<{ success: boolean; error?: string }> => {
    if (!SAVE_SCRIPT_URL || SAVE_SCRIPT_URL.includes('COLE_AQUI')) {
        const errorMsg = "URL do script de salvamento não configurado.";
        console.error(errorMsg);
        return { success: false, error: errorMsg };
    }

    try {
        const response = await fetch(SAVE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ key, value }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro do servidor: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        if (result.success) {
            return { success: true };
        } else {
            throw new Error(result.error || 'O script retornou um erro desconhecido.');
        }
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        return { success: false, error: (error as Error).message };
    }
};
