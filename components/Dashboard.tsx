'use client';
import React, { useEffect, useState } from "react";
import { VehicleStatus } from "../types";
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
import { Wrench, Bike, TrendingUp, AlertTriangle } from "lucide-react";
import { summarizeDailyWorkshop } from "../services/geminiService";

export const Dashboard: React.FC = () => {
  const { vehicles, maintenanceRecords: records } = useAppContext();
  const [aiSummary, setAiSummary] = useState<string>(
    "Analisando atividades da oficina...",
  );

  const totalVehicles = vehicles.length;
  const rentedVehicles = vehicles.filter(
    (v) => v.status === VehicleStatus.RENTED,
  ).length;
  const inMaintenance = vehicles.filter(
    (v) => v.status === VehicleStatus.MAINTENANCE,
  ).length;

  const today = new Date().toISOString().split("T")[0];
  const arrivedToday = records.filter((r) => r.entry_date.startsWith(today));

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
    { name: "Em Rota", value: rentedVehicles, color: "#2563eb" },
    {
      name: "Pátio",
      value: totalVehicles - rentedVehicles - inMaintenance,
      color: "#10b981",
    },
    { name: "Oficina", value: inMaintenance, color: "#f59e0b" },
  ];

  useEffect(() => {
    const fetchSummary = async () => {
      if (arrivedToday.length > 0) {
        const summary = await summarizeDailyWorkshop(arrivedToday);
        setAiSummary(summary);
      } else {
        setAiSummary(
          "Oficina tranquila hoje. Todas as motos da frota GC estão em operação ou aguardando rotina.",
        );
      }
    };
    fetchSummary();
  }, [records]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0a2342] tracking-tight uppercase">
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
        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-110"></div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Frota GC
          </p>
          <h3 className="text-4xl font-extrabold text-[#0a2342] mt-3">
            {totalVehicles}
          </h3>
          <div className="mt-6 flex items-center gap-2 text-blue-600 font-bold text-xs bg-blue-50 w-fit px-3 py-1.5 rounded-full">
            <Bike size={14} /> Ativos
          </div>
        </div>

        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 group">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Alugadas
          </p>
          <h3 className="text-4xl font-extrabold text-green-600 mt-3">
            {rentedVehicles}
          </h3>
          <div className="mt-6 flex items-center gap-2 text-green-700 font-bold text-xs bg-green-50 w-fit px-3 py-1.5 rounded-full">
            <TrendingUp size={14} />{" "}
            {((rentedVehicles / totalVehicles) * 100).toFixed(0)}% Ocupação
          </div>
        </div>

        <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Em Manutenção
          </p>
          <h3 className="text-4xl font-extrabold text-amber-500 mt-3">
            {inMaintenance}
          </h3>
          <div className="mt-6 flex items-center gap-2 text-amber-700 font-bold text-xs bg-amber-50 w-fit px-3 py-1.5 rounded-full">
            <Wrench size={14} /> Atenção
          </div>
        </div>

        <div className="bg-[#0a2342] p-7 rounded-[2rem] shadow-xl text-white">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Financeiro Diário
          </p>
          <h3 className="text-3xl font-extrabold text-yellow-400 mt-3">
            R$ 1.840
          </h3>
          <p className="text-xs text-slate-300 mt-6 font-medium">
            Previsão de recebimento para hoje
          </p>
        </div>
      </div>

      {/* AI Section with GC Styling */}
      <div className="bg-white rounded-[2rem] p-8 border-l-4 border-blue-600 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-xl">
            <AlertTriangle className="text-white w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-xl text-[#0a2342]">
            Relatório Inteligente da Oficina
          </h3>
        </div>
        <p className="text-slate-600 leading-relaxed font-medium italic">
          "{aiSummary}"
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-extrabold text-[#0a2342] mb-8">
            Receita de Aluguéis (7 dias)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
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
                  fill="#2563eb"
                  radius={[10, 10, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center">
          <h3 className="text-xl font-extrabold text-[#0a2342] self-start mb-8">
            Status Geral da Frota
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
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
