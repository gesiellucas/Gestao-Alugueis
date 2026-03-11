'use client';
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { MaintenanceType, MaintenanceRecord, VEHICLE_STATUS_IDS } from "../../../types";
import { ArrowLeft, Save } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";

export const OficinaNovePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { vehicles, workshops, handleAddMaintenanceRecord } = useAppContext();

  const [selectedPlate, setSelectedPlate] = useState(searchParams.get("plate") ?? "");
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");
  const [form, setForm] = useState({
    type: MaintenanceType.PREVENTIVE,
    description: "",
    mechanic_name: "",
  });

  const availableVehicles = vehicles.filter(
    (v) => v.status_id !== VEHICLE_STATUS_IDS.MAINTENANCE,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.plate === selectedPlate);
    if (!vehicle || !form.mechanic_name || !form.description) return;

    const record: MaintenanceRecord = {
      id: "",
      vehicle_id: vehicle.id,
      workshop_id: selectedWorkshopId || null,
      vehicle_plate: vehicle.plate,
      entry_date: new Date().toISOString(),
      status: "OPEN",
      cost: 0,
      type: form.type,
      mechanic_name: form.mechanic_name,
      description: form.description,
    };

    try {
      await handleAddMaintenanceRecord(record);
      router.push("/oficina");
    } catch (err) {
    }
  };

  return (
    <div className="space-y-8">
      <ModuleHeader 
        title="Registrar Entrada" 
        subtitle="Entrada de veículo para manutenção técnica."
        breadcrumbs={[
          { label: "Oficina", href: "/oficina" },
          { label: "Registrar Entrada" }
        ]}
      />

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#1a4fd6] p-8">
          <h3 className="font-black text-xl uppercase tracking-tighter text-white">
            Entrada de Veículo na Oficina
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Moto da Frota
            </label>
            <select
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 focus:border-blue-500 transition-all border appearance-none"
              value={selectedPlate}
              onChange={(e) => setSelectedPlate(e.target.value)}
              required
            >
              <option value="">Selecione a placa...</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.plate}>
                  {v.plate} - {v.model?.name || 'Modelo desconhecido'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Oficina
            </label>
            <select
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 focus:border-blue-500 transition-all border appearance-none"
              value={selectedWorkshopId}
              onChange={(e) => setSelectedWorkshopId(e.target.value)}
              required
            >
              <option value="">Selecione a oficina...</option>
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Tipo de Serviço
            </label>
            <select
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 border appearance-none"
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as MaintenanceType })
              }
            >
              {Object.values(MaintenanceType).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Mecânico Responsável
            </label>
            <input
              type="text"
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 border"
              value={form.mechanic_name}
              onChange={(e) =>
                setForm({ ...form, mechanic_name: e.target.value })
              }
              placeholder="Nome do técnico"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              Observações Técnicas
            </label>
            <textarea
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 border resize-none"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Descreva o que será feito..."
              required
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/oficina")}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-[#1a4fd6] text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} /> Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
