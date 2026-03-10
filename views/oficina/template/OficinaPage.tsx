'use client';
import React from "react";
import Link from "next/link";
import { useAppContext } from "../../../contexts/AppContext";
import { PlusCircle, ShieldAlert, Clock, CheckCircle } from "lucide-react";

export const OficinaPage: React.FC = () => {
  const { maintenanceRecords: records, handleFinishMaintenance } =
    useAppContext();

  const activeRecords = records.filter((r) => r.status === "OPEN");
  const historyRecords = records
    .filter((r) => r.status === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0a2342] uppercase tracking-tight">
            Oficina
          </h2>
          <p className="text-slate-500 font-medium">
            Controle de manutenção preventiva e corretiva.
          </p>
        </div>
        <Link
          href="/oficina/novo_entrada"
          className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-xl flex items-center gap-2 font-black shadow-lg shadow-amber-100 transition-all uppercase tracking-wider"
        >
          <PlusCircle size={20} />
          Registrar Entrada
        </Link>
      </div>

      {/* Active Maintenance Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-amber-50">
          <ShieldAlert size={18} className="text-amber-500" />
          <h3 className="font-black text-[#0a2342] uppercase tracking-tight text-sm">
            Em Manutenção Agora
          </h3>
          <span className="ml-auto bg-amber-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
            {activeRecords.length}
          </span>
        </div>
        {activeRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-sm">
            Nenhum veículo em manutenção no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Placa</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Mecânico</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Observação</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Entrada</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {activeRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-50 hover:bg-amber-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/oficina/${record.vehicle_id}`}
                        className="font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-lg text-sm uppercase tracking-tight hover:bg-amber-100 transition-colors"
                      >
                        {record.vehicle_plate}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#0a2342]">{record.type}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{record.mechanic_name}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{record.description}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {new Date(record.entry_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleFinishMaintenance(record.id)}
                        className="bg-green-500 hover:bg-green-600 text-white font-black px-4 py-2 rounded-xl transition-all shadow-sm shadow-green-100 uppercase text-xs tracking-widest flex items-center gap-1.5 ml-auto"
                      >
                        <CheckCircle size={14} />
                        Finalizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <CheckCircle size={18} className="text-green-500" />
          <h3 className="font-black text-[#0a2342] uppercase tracking-tight text-sm">
            Histórico de Manutenções
          </h3>
          <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-black px-2.5 py-0.5 rounded-full">
            {historyRecords.length}
          </span>
        </div>
        {historyRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-sm">
            Nenhuma manutenção concluída ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Placa</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Mecânico</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Observação</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Concluído</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Custo</th>
                </tr>
              </thead>
              <tbody>
                {historyRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/oficina/${record.vehicle_id}`}
                        className="font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg text-sm uppercase tracking-tight hover:bg-slate-200 transition-colors"
                      >
                        {record.vehicle_plate}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#0a2342]">{record.type}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{record.mechanic_name}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{record.description}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      {record.completion_date
                        ? new Date(record.completion_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {record.cost != null
                        ? record.cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
