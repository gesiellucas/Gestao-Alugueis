'use client';
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { localVehiclesApi } from "../../../database/api/local/vehicles";
import { ArrowLeft, Save } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";

export const VeiculoEditarPage: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { vehicles, setVehicles, vehicleModels } = useAppContext();

  const vehicle = vehicles.find((v) => v.id === id);

  const [form, setForm] = useState<{
    plate: string;
    model_id: string | "";
    year: number;
    mileage: number;
  }>({
    plate: vehicle?.plate || "",
    model_id: vehicle?.model_id || "",
    year: vehicle?.year || new Date().getFullYear(),
    mileage: vehicle?.mileage || 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/veiculos")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg">
            Veículo não encontrado.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await localVehiclesApi.update(id, {
        plate: form.plate,
        model_id: form.model_id || vehicle.model_id,
        year: form.year,
        mileage: form.mileage,
      });

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
              ...v,
              plate: form.plate,
              model_id: form.model_id || v.model_id,
              year: form.year,
              mileage: form.mileage,
              model: vehicleModels.find(m => m.id === form.model_id),
            }
            : v,
        ),
      );
      router.push(`/veiculo/${id}`);
    } catch (err) {
      setError("Erro ao atualizar veículo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">


      <ModuleHeader
        title={`Editar Veículo`}
        subtitle=""
        breadcrumbs={[
          { label: "Veículos", href: "/veiculos" },
          { label: vehicle.plate }
        ]} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-brand-blue p-4">
          <h3 className="font-bold  uppercase tracking-tighter text-white">
            {vehicle.plate} - {vehicle.model?.name || 'Modelo desconhecido'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 font-medium text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Placa
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
                value={form.plate}
                onChange={(e) =>
                  setForm({ ...form, plate: e.target.value.toUpperCase() })
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Modelo
              </label>
              <select
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border appearance-none"
                value={form.model_id}
                onChange={(e) => setForm({ ...form, model_id: e.target.value })}
                required
              >
                <option value="">Selecione um modelo...</option>
                {vehicleModels.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.brand})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Ano
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
                value={form.year}
                onChange={(e) =>
                  setForm({ ...form, year: parseInt(e.target.value) || 0 })
                }
                min={2000}
                max={2030}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Quilometragem
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
                value={form.mileage}
                onChange={(e) =>
                  setForm({ ...form, mileage: parseInt(e.target.value) || 0 })
                }
                min={0}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => router.push(`/veiculo/${id}`)}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 bg-[#004AAD] text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
