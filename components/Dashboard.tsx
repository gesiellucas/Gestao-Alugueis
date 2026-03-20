'use client';
import React, { useEffect, useState } from "react";
import { VEHICLE_STATUS_IDS } from "../types";
import { useAppContext } from "../contexts/AppContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Wrench, Bike, TrendingUp, AlertTriangle, Lock } from "lucide-react";
import StatCard from "./StatCard";
import { summarizeDailyWorkshop } from "../services/geminiService";
import { useFinanceAccess } from "../hooks/useFinanceAccess";

export const Dashboard: React.FC = () => {
  const { vehicles, maintenanceRecords: records } = useAppContext();
  const hasFinanceAccess = useFinanceAccess();

  const totalVehicles = vehicles.length;
  const rentedVehicles = vehicles.filter(
    (v) => v.status_id === VEHICLE_STATUS_IDS.RENTED,
  ).length;
  const inMaintenance = vehicles.filter(
    (v) => v.status_id === VEHICLE_STATUS_IDS.MAINTENANCE,
  ).length;

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
    {
      name: "Pátio",
      value: totalVehicles - rentedVehicles - inMaintenance,
      color: "#10b981",
    },
    { name: "Oficina", value: inMaintenance, color: "#f59e0b" },
  ];

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
          value={rentedVehicles}
          label={`${((rentedVehicles / (totalVehicles || 1)) * 100).toFixed(0)}% Ocupação`}
          Icon={TrendingUp}
          variant="green"
        />

        <StatCard
          title="Em Manutenção"
          value={inMaintenance}
          label="Atenção"
          Icon={Wrench}
          variant="amber"
        />

        {hasFinanceAccess && (
          <div className="bg-[#004AAD] p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-110"></div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-blue-200 uppercase tracking-widest mb-3">
                Financeiro Diário
              </p>
              <h3 className="text-3xl font-extrabold text-white">
                R$ 1.840
              </h3>
              <p className="text-xs text-blue-200 mt-6 font-medium">
                Previsão de recebimento para hoje
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {hasFinanceAccess ? (
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
            <h3 className="text-xl font-extrabold text-[#004AAD] mb-8">
              Receita de Aluguéis (7 dias)
            </h3>
            <div className="h-72 w-full min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={revenueData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="income"
                    fill="#0C4AA5"
                    radius={[10, 10, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-4">
            <Lock size={32} className="text-slate-300" />
            <div className="text-center">
              <p className="font-bold text-slate-400">Receita de Aluguéis</p>
              <p className="text-sm text-slate-300 mt-1">Acesso ao módulo financeiro necessário</p>
            </div>
          </div>
        )}

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center">
          <h3 className="text-xl font-extrabold text-[#004AAD] self-start mb-8">
            Status Geral da Frota
          </h3>
          <div className="h-64 w-full min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-bold text-slate-600">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
