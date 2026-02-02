
import React from 'react';
import { FunnelConfig } from '../../types';
import { formatNumber, formatPercent } from '../../utils/formatters';
import ChartCard from '../ChartCard';
import * as Icons from '../Icons';

interface RealizedFunnelProps {
    config: FunnelConfig;
    realizedData: { mes: number, faturamento_real: number, vendas_real: number, leads_real: number }[];
}

const RealizedFunnel: React.FC<RealizedFunnelProps> = ({ config, realizedData }) => {
    // Calculate monthly goals based on config
    const leadsMesMeta = config.cpl > 0 ? config.investimento_mensal / config.cpl : 0;
    const agendamentosMesMeta = leadsMesMeta * (config.taxa_agendamento / 100);
    const reunioesMesMeta = agendamentosMesMeta * (config.taxa_comparecimento / 100);
    const vendasMesMeta = reunioesMesMeta * (config.taxa_conversao / 100);

    // Sum up realized values for the current period (e.g., year to date)
    const currentMonth = new Date().getMonth();
    const realizedTotal = realizedData.reduce((acc, monthData, index) => {
        if (index <= currentMonth) {
            acc.leads += monthData.leads_real;
            acc.vendas += monthData.vendas_real;
        }
        return acc;
    }, { leads: 0, vendas: 0 });

    // For now, we only have realized leads and sales. We'll project the in-between stages based on realized leads.
    // This is an assumption until more detailed tracking is available.
    const realizedAgendamentos = realizedTotal.leads * (config.taxa_agendamento / 100);
    const realizedReunioes = realizedAgendamentos * (config.taxa_comparecimento / 100);


    const stages = [
        { name: 'Leads', realized: realizedTotal.leads, goal: leadsMesMeta * (currentMonth + 1) },
        { name: 'Agendados', realized: realizedAgendamentos, goal: agendamentosMesMeta * (currentMonth + 1) },
        { name: 'Reuniões', realized: realizedReunioes, goal: reunioesMesMeta * (currentMonth + 1) },
        { name: 'Vendas', realized: realizedTotal.vendas, goal: vendasMesMeta * (currentMonth + 1) },
    ];

    const FunnelRow: React.FC<{ stage: typeof stages[0] }> = ({ stage }) => {
        const percentage = stage.goal > 0 ? (stage.realized / stage.goal) * 100 : 0;
        let icon: React.ReactNode;
        if (percentage >= 80) icon = <Icons.CheckCircle className="h-4 w-4 text-brand-green" />;
        else if (percentage >= 50) icon = <Icons.AlertTriangle className="h-4 w-4 text-brand-yellow" />;
        else icon = <Icons.XCircle className="h-4 w-4 text-brand-red" />;

        return (
            <div className="space-y-1">
                <div className="flex justify-between items-baseline text-xs">
                    <span className="font-bold text-text-main">{stage.name}</span>
                    <span className="font-mono text-text-secondary">{formatNumber(stage.realized)} de {formatNumber(stage.goal)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-full bg-bg-subtle rounded-full h-3">
                        <div 
                            className="bg-brand-purple h-3 rounded-full"
                            style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                    </div>
                    <div className="w-12 text-center font-bold text-xs flex items-center gap-1">
                        {icon}
                        <span>{formatPercent(percentage)}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <ChartCard title="Funil Realizado vs. Meta" loading={false}>
            <div className="space-y-4 p-2">
                {stages.map(stage => <FunnelRow key={stage.name} stage={stage} />)}
            </div>
        </ChartCard>
    );
};

export default RealizedFunnel;
