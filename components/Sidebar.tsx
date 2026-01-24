
import React from 'react';
import { Target, DollarSign, Briefcase, Users, History } from './Icons';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const menuItems = [
    { id: 'objectives', label: 'Objetivos', icon: Target },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'operation', label: 'Operação', icon: Briefcase },
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'history', label: 'Histórico', icon: History },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-border">
            <div className="flex flex-col items-start leading-none select-none">
              <h1 className="text-4xl font-serif font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-amber-600 via-yellow-400 to-amber-600 drop-shadow-sm">
                ARC
              </h1>
              <span className="text-[10px] text-text-secondary uppercase tracking-[0.25em] font-medium pl-1">
                café & estratégia
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-brand-blue/10 text-brand-blue border-r-4 border-brand-blue' 
                      : 'text-text-secondary hover:bg-bg-subtle hover:text-text-main'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-brand-blue' : 'text-text-secondary'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Footer / Info */}
          <div className="p-4 border-t border-border">
            <div className="bg-bg-subtle/50 rounded-lg p-3">
              <p className="text-xs text-text-secondary font-medium">ARC Assessoria</p>
              <p className="text-[10px] text-text-secondary opacity-70">v1.2.0 • Pro Dashboard</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
