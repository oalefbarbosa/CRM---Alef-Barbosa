
import { FunnelConfig, MonthlyScenarioData, Projections, ScenarioType } from '../types';

interface ScenarioParams {
  adicao_mensal_base: number;
  churn: number; // as decimal, e.g., 0.10
}

const SCENARIOS: Record<ScenarioType, ScenarioParams> = {
  inicial: { adicao_mensal_base: 5, churn: 0.10 },
  bom: { adicao_mensal_base: 7, churn: 0.10 },
  otimo: { adicao_mensal_base: 9, churn: 0.12 },
};

/**
 * Calculates the monthly projection for a single scenario.
 */
function calculateSingleScenario(
  config: FunnelConfig, 
  scenario: ScenarioType
): MonthlyScenarioData[] {
  const params = SCENARIOS[scenario];
  const monthlyProjections: MonthlyScenarioData[] = [];
  
  // Use the calculated monthly sales from the funnel config as the "adicao_mensal"
  const leadsMes = config.cpl > 0 ? config.investimento_mensal / config.cpl : 0;
  const agendamentosMes = leadsMes * (config.taxa_agendamento / 100);
  const reunioesMes = agendamentosMes * (config.taxa_comparecimento / 100);
  const vendasMes = reunioesMes * (config.taxa_conversao / 100);

  let clientesAcumulados = config.clientes_atuais;

  for (let i = 1; i <= 12; i++) {
    // For month 1, start with current clients. For subsequent months, calculate churn and add new ones.
    if (i > 1) {
      clientesAcumulados = (clientesAcumulados * (1 - params.churn)) + vendasMes;
    }
    
    const faturamentoProjetado = clientesAcumulados * config.ticket_medio;

    monthlyProjections.push({
      mes: i,
      clientes_projetados: clientesAcumulados,
      faturamento_projetado: faturamentoProjetado,
    });
  }

  return monthlyProjections;
}

/**
 * Calculates and returns projections for all three scenarios.
 */
export function calculateAllProjections(config: FunnelConfig): Projections {
  return {
    inicial: calculateSingleScenario(config, 'inicial'),
    bom: calculateSingleScenario(config, 'bom'),
    otimo: calculateSingleScenario(config, 'otimo'),
  };
}
