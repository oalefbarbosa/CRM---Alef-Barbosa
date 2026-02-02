
import { FunnelConfig, MonthlyScenarioData, Projections, ScenarioType, ScenarioSetting } from '../types';

/**
 * Calculates the monthly projection for a single scenario based on its specific settings.
 */
function calculateSingleScenario(
  config: FunnelConfig, 
  scenarioSetting: ScenarioSetting
): MonthlyScenarioData[] {
  const monthlyProjections: MonthlyScenarioData[] = [];
  
  let clientesAcumulados = config.clientes_atuais;

  for (let i = 1; i <= 12; i++) {
    // For month 1, start with current clients. For subsequent months, calculate churn and add new ones.
    if (i > 1) {
      clientesAcumulados = (clientesAcumulados * (1 - scenarioSetting.churn / 100)) + scenarioSetting.adicao_mensal;
    }
    
    const faturamentoProjetado = clientesAcumulados * config.ticket_medio;

    monthlyProjections.push({
      mes: i,
      clientes_projetados: Math.round(clientesAcumulados),
      faturamento_projetado: faturamentoProjetado,
    });
  }

  return monthlyProjections;
}

/**
 * Calculates and returns projections for all three scenarios.
 */
export function calculateAllProjections(config: FunnelConfig, scenarioSettings: ScenarioSetting[]): Projections {
  const getSetting = (name: ScenarioType) => scenarioSettings.find(s => s.name === name)!;
  return {
    inicial: calculateSingleScenario(config, getSetting('inicial')),
    bom: calculateSingleScenario(config, getSetting('bom')),
    otimo: calculateSingleScenario(config, getSetting('otimo')),
  };
}


/**
 * Calculates the number of working days in a given month and year.
 * @param year The full year (e.g., 2024).
 * @param month The month (1-12).
 * @returns The total number of working days (Mon-Fri).
 */
export function getWorkingDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    if (dayOfWeek > 0 && dayOfWeek < 6) {
      workingDays++;
    }
  }
  return workingDays;
}

/**
 * Calculates the number of working days that have passed in the current month.
 * @returns The number of past working days.
 */
export function getPassedWorkingDays(): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    let passedDays = 0;
    for (let day = 1; day <= today; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        if (dayOfWeek > 0 && dayOfWeek < 6) {
            passedDays++;
        }
    }
    return passedDays;
}
