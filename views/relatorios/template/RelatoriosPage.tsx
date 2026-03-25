'use client';
import React, { useState } from 'react';
import { FileText, Wrench, Car, Users, BarChart3 } from 'lucide-react';
import { ModuleHeader } from '@/components/ModuleHeader';
import { AlugueisReport } from '../components/AlugueisReport';
import { OficinaReport } from '../components/OficinaReport';
import { VeiculosReport } from '../components/VeiculosReport';
import { ClientesReport } from '../components/ClientesReport';

type ReportTab = 'alugueis' | 'oficina' | 'veiculos' | 'clientes';

const tabs: { key: ReportTab; label: string; icon: React.ElementType }[] = [
  { key: 'alugueis', label: 'Aluguéis', icon: FileText },
  { key: 'oficina', label: 'Oficina', icon: Wrench },
  { key: 'veiculos', label: 'Veículos', icon: Car },
  { key: 'clientes', label: 'Clientes', icon: Users },
];

export const RelatoriosPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('alugueis');

  return (
    <div className="space-y-4">
      <ModuleHeader
        title="Relatórios"
        subtitle="Exporte relatórios detalhados em XLSX ou CSV."
        breadcrumbs={[{ label: 'Relatórios' }]}
        extraHeader={
          <div className="flex items-center gap-2 text-slate-400">
            <BarChart3 size={20} />
            <span className="text-sm font-bold">Central de Relatórios</span>
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="bg-white divide-x divide-slate-200 flex p-1 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 first:rounded-l-lg last:rounded-r-lg text-sm font-bold transition-all ${isActive
                ? 'bg-brand-blue text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-white/60'
                }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'alugueis' && <AlugueisReport />}
      {activeTab === 'oficina' && <OficinaReport />}
      {activeTab === 'veiculos' && <VeiculosReport />}
      {activeTab === 'clientes' && <ClientesReport />}
    </div>
  );
};
