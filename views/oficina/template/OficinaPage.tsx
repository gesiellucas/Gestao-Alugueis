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
            Oficina GC
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

      {activeRecords.length > 0 && (
        <div>
          <h3 className="text-lg font-extrabold text-[#0a2342] mb-4 uppercase tracking-tight">
            Em Manutenção
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-[2.5rem] shadow-sm border-t-4 border-amber-500 overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <Link
                      href={`/oficina/${record.vehicle_id}`}
                      className="bg-amber-50 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors"
                    >
                      <span className="font-black text-amber-700 text-xl tracking-tighter uppercase">
                        {record.vehicle_plate}
                      </span>
                    </Link>
                    <div className="bg-slate-50 p-3 rounded-full text-slate-400">
                      <ShieldAlert size={20} />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Serviço
                      </p>
                      <p className="font-bold text-[#0a2342]">{record.type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Observação
                      </p>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">
                        {record.description}
                      </p>
                    </div>
                    <div className="pt-6 border-t border-slate-50 flex items-center gap-2">
                      <Clock size={16} className="text-slate-300" />
                      <span className="text-xs font-bold text-slate-400">
                        Entrada:{" "}
                        {new Date(record.entry_date).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleFinishMaintenance(record.id)}
                      className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl transition-all shadow-md shadow-green-100 uppercase text-xs tracking-widest"
                    >
                      Finalizar e Liberar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {historyRecords.length > 0 && (
        <div>
          <h3 className="text-lg font-extrabold text-[#0a2342] mb-4 uppercase tracking-tight">
            Histórico
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {historyRecords.map((record) => (
              <Link
                key={record.id}
                href={`/oficina/${record.vehicle_id}`}
                className="bg-white rounded-[2.5rem] shadow-sm border-t-4 border-green-500 overflow-hidden block hover:shadow-lg transition-all"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-green-50 px-4 py-2 rounded-xl">
                      <span className="font-black text-green-700 text-xl tracking-tighter uppercase">
                        {record.vehicle_plate}
                      </span>
                    </div>
                    <div className="bg-green-50 p-3 rounded-full text-green-500">
                      <CheckCircle size={20} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Serviço
                      </p>
                      <p className="font-bold text-[#0a2342]">{record.type}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Clock size={14} />
                      Concluído:{" "}
                      {record.completion_date
                        ? new Date(record.completion_date).toLocaleDateString()
                        : "-"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeRecords.length === 0 && historyRecords.length === 0 && (
        <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm">
          <ShieldAlert size={48} className="mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500 font-medium">
            Nenhum registro na oficina ainda.
          </p>
        </div>
      )}
    </div>
  );
};
