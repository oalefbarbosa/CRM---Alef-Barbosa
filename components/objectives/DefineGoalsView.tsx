
import React from 'react';
import { FunnelConfig, Projections } from '../../types';
import FunnelConfigurator from './FunnelConfigurator';
import GoalsProjection from './GoalsProjection';

interface DefineGoalsViewProps {
  config: FunnelConfig;
  setConfig: (config: FunnelConfig) => void;
  onSave: (config: FunnelConfig) => void;
  projections: Projections;
  availableYears: number[];
  onYearChange: (year: number) => void;
}

const DefineGoalsView: React.FC<DefineGoalsViewProps> = (props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Column: Configurator */}
      <div className="lg:col-span-2">
        <FunnelConfigurator 
          config={props.config}
          setConfig={props.setConfig}
          onSave={props.onSave}
          availableYears={props.availableYears}
          onYearChange={props.onYearChange}
        />
      </div>

      {/* Right Column: Projections */}
      <div className="lg:col-span-3">
        <GoalsProjection 
            config={props.config}
            projections={props.projections}
        />
      </div>
    </div>
  );
};

export default DefineGoalsView;
