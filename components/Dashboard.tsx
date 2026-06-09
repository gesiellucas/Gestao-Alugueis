'use client';
import React from "react";
import { useAppContext } from "../contexts/AppContext";
import { Wrench, Bike, TrendingUp, Lock, ShieldOff } from "lucide-react";
import StatCard from "./StatCard";
import GaugeChart from "./GaugeChart";

import { useFinanceAccess } from "../hooks/useFinanceAccess";

export const Dashboard: React.FC = () => {
  const { vehicles, maintenanceRecords: records, vehicleStatusIds } = useAppContext();
  const hasFinanceAccess = useFinanceAccess();

  const totalVehicles = vehicles.length;
  const rentedVehicles = vehicles.filter(
    (v) => v.status_id === vehicleStatusIds.RENTED,
  ).length;
  const inMaintenance = vehicles.filter(
    (v) => v.status_id === vehicleStatusIds.MAINTENANCE,
  ).length;
  const unavailableVehicles = vehicles.filter(
    (v) => v.vehicleStatus?.name === 'Roubada' || v.vehicleStatus?.name === 'PT',
  ).length;
  const availableVehicles = totalVehicles - rentedVehicles - inMaintenance - unavailableVehicles;

  const today = new Date().toISOString().split("T")[0];
  const arrivedToday = records.filter((r) => r.entry_date?.startsWith(today));

  const revenueData = [
    { name: "Seg", income: 4200 },
    { name: "Ter", income: 3800 },
    { name: "Qua", income: 5100 },
    { name: "Qui", income: 4900 },
    { name: "Sex", income: 6200 },
    { name: "Sáb", income: 4500 },
    { name: "Dom", income: 3200 },
  ];

  const statusData = [
    { name: "Em Rota", value: rentedVehicles, color: "#004AAD" },
    { name: "Pátio", value: availableVehicles, color: "#10b981" },
    { name: "Oficina", value: inMaintenance, color: "#f59e0b" },
    { name: "Roubada", value: vehicles.filter(v => v.vehicleStatus?.name === 'Roubada').length, color: "#7c3aed" },
    { name: "PT", value: vehicles.filter(v => v.vehicleStatus?.name === 'PT').length, color: "#1e293b" },
  ].filter(s => s.value > 0);

  const gaugeSegments = statusData.map(s => ({ label: s.name, value: s.value, color: s.color }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#004AAD] tracking-tight uppercase">
            Resumo Operacional
          </h2>
          <p className="text-slate-500 font-medium">
            Controle em tempo real da sua frota de locação.
          </p>
        </div>
        <div className="bg-white border border-slate-200 px-5 py-3 rounded-xl shadow-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-bold text-slate-700">
            SISTEMA ATIVO
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Frota GC"
          value={totalVehicles}
          label="Ativos"
          Icon={Bike}
          variant="blue"
        />

        <StatCard
          title="Alugadas"
          value={rentedVehicles}
          label={`${((rentedVehicles / (totalVehicles || 1)) * 100).toFixed(0)}% Ocupação`}
          Icon={TrendingUp}
          variant="green"
        />

        <StatCard
          title="Indisponíveis"
          value={unavailableVehicles}
          label={unavailableVehicles > 0 ? 'Roubada / PT' : 'Nenhum'}
          Icon={ShieldOff}
          variant="amber"
        />

        <StatCard
          title="Em Manutenção"
          value={inMaintenance}
          label="Atenção"
          Icon={Wrench}
          variant="amber"
        />

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <h3 className="text-xl font-extrabold text-[#004AAD] self-start mb-8">
            Status Geral da Frota
          </h3>
          <GaugeChart segments={gaugeSegments} total={totalVehicles} />
        </div>
      </div>
    </div>
  );
};
