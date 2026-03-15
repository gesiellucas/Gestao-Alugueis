'use client';
import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "../../../contexts/AppContext";
import {
  ArrowLeft,
  Wrench,
  CheckCircle,
  Clock,
  Hash,
  Circle,
} from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";

export const OficinaDetalhePage: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { vehicles, maintenanceRecords, handleFinishMaintenance } =
    useAppContext();

  const vehicle = vehicles.find((v) => v.id === id);
  const vehicleRecords = maintenanceRecords
    .filter((r) => r.vehicle_id === id)
    .sort(
      (a, b) =>
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
    );

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/oficina")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar para Oficina
        </button>
        <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg">
            Veículo não encontrado.
          </p>
        </div>
      </div>
    );
  }

  const statusColor = vehicle.vehicleStatus?.color || "#6b7280";
  const statusName = vehicle.vehicleStatus?.name || "Desconhecido";

  const activeRecords = vehicleRecords.filter((r) => r.status === "OPEN");
  const completedRecords = vehicleRecords.filter(
    (r) => r.status === "COMPLETED",
  );

  return (
    <div className="space-y-8">
      <ModuleHeader
        title={vehicle.plate}
        subtitle={`Histórico de manutenções da moto ${vehicle.model?.name || 'Moto'}.`}
        breadcrumbs={[
          { label: "Oficina", href: "/oficina" },
          { label: vehicle.plate }
        ]}
        extraHeader={
          <Link
            href="/oficina/novo_entrada"
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm transition-all"
          >
            <Wrench size={16} /> Nova Entrada
          </Link>
        }
      />

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="h-56 lg:h-auto bg-[#f8fafc] flex items-center justify-center p-8">
            <img
              src={vehicle.model?.image_url || undefined}
              alt={vehicle.model?.name || 'Moto'}
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
            />
          </div>
          <div className="lg:col-span-2 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold text-[#004AAD]">
                {vehicle.model?.name || 'Modelo desconhecido'}
              </h2>
              <span
                className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border"
                style={{
                  backgroundColor: `${statusColor}20`,
                  color: statusColor,
                  borderColor: `${statusColor}40`,
                }}
              >
                {statusName}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Hash size={10} /> Placa
                </p>
                <p className="text-lg font-bold text-slate-700 font-mono">
                  {vehicle.plate}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Circle size={10} /> Km
                </p>
                <p className="text-lg font-bold text-slate-700">
                  {vehicle.mileage.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-4 rounded-xl ${activeRecords.length > 0 ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Status Oficina
                </p>
                <p
                  className={`text-lg font-bold ${activeRecords.length > 0 ? "text-amber-700" : "text-green-700"}`}
                >
                  {activeRecords.length > 0
                    ? `${activeRecords.length} aberto(s)`
                    : "Liberado"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeRecords.length > 0 && (
        <div>
          <h3 className="text-xl font-extrabold text-[#004AAD] mb-4 uppercase tracking-tight flex items-center gap-2">
            <Wrench size={20} className="text-amber-500" /> Manutenção em
            Andamento
          </h3>
          <div className="space-y-4">
            {activeRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-amber-500"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <p className="font-bold text-[#004AAD] text-lg">
                      {record.type}
                    </p>
                    <p className="text-sm text-slate-600">
                      {record.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> Entrada:{" "}
                        {new Date(record.entry_date).toLocaleDateString()}
                      </span>
                      <span>Mecânico: {record.mechanic_name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleFinishMaintenance(record.id)}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-all uppercase text-xs tracking-widest whitespace-nowrap"
                  >
                    Finalizar e Liberar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedRecords.length > 0 && (
        <div>
          <h3 className="text-xl font-extrabold text-[#004AAD] mb-4 uppercase tracking-tight flex items-center gap-2">
            <CheckCircle size={20} className="text-green-500" /> Histórico
            Concluído
          </h3>
          <div className="space-y-4">
            {completedRecords.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="font-bold text-[#004AAD]">{record.type}</p>
                    <p className="text-sm text-slate-500">
                      {record.description}
                    </p>
                    <p className="text-xs text-slate-400 font-bold">
                      Mecânico: {record.mechanic_name}
                    </p>
                  </div>
                  <div className="text-right text-sm space-y-1">
                    <p className="text-slate-400">
                      Entrada: {new Date(record.entry_date).toLocaleDateString()}
                    </p>
                    {record.completion_date && (
                      <p className="text-green-600 font-bold">
                        Saída:{" "}
                        {new Date(record.completion_date).toLocaleDateString()}
                      </p>
                    )}
                    {record.cost > 0 && (
                      <p className="text-slate-700 font-bold">
                        R$ {record.cost.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vehicleRecords.length === 0 && (
        <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-300" />
          <p className="text-slate-500 font-medium">
            Nenhum registro de oficina para este veículo.
          </p>
        </div>
      )}
    </div>
  );
};
