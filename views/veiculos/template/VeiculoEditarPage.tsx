'use client';
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { getVehiclesApi } from "../../../lib/apiFactory";
import { VehicleStatus } from "../../../types";
import { ArrowLeft, Save } from "lucide-react";

export const VeiculoEditarPage: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { vehicles, setVehicles, vehicleModels } = useAppContext();

  const vehicle = vehicles.find((v) => v.id === id);

  const [form, setForm] = useState({
    plate: vehicle?.plate || "",
    model_id: vehicle?.model_id || "",
    year: vehicle?.year || new Date().getFullYear(),
    mileage: vehicle?.mileage || 0,
    status: vehicle?.status || VehicleStatus.AVAILABLE,
    default_monthly_rate: vehicle?.default_monthly_rate || 800,
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
        <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm">
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
      await getVehiclesApi().update(id, {
        plate: form.plate,
        model_id: form.model_id,
        year: form.year,
        mileage: form.mileage,
        status: form.status,
        default_monthly_rate: form.default_monthly_rate,
      });

      setVehicles((prev) =>
        prev.map((v) =>
          v.id === id
            ? {
                ...v,
                plate: form.plate,
                model_id: form.model_id,
                year: form.year,
                mileage: form.mileage,
                status: form.status,
                default_monthly_rate: form.default_monthly_rate,
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
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/veiculo/${id}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <h2 className="text-3xl font-extrabold text-[#0a2342] uppercase tracking-tight">
          Editar Veículo
        </h2>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#0a2342] p-8">
          <h3 className="font-black text-xl uppercase tracking-tighter text-white">
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
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Placa
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all border"
                value={form.plate}
                onChange={(e) =>
                  setForm({ ...form, plate: e.target.value.toUpperCase() })
                }
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Modelo
              </label>
              <select
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all border appearance-none"
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
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Ano
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all border"
                value={form.year}
                onChange={(e) =>
                  setForm({ ...form, year: parseInt(e.target.value) || 0 })
                }
                min={2000}
                max={2030}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Quilometragem
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all border"
                value={form.mileage}
                onChange={(e) =>
                  setForm({ ...form, mileage: parseInt(e.target.value) || 0 })
                }
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Status
              </label>
              <select
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 border appearance-none"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as VehicleStatus })
                }
              >
                {Object.values(VehicleStatus).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Valor Mensal (R$)
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all border"
                value={form.default_monthly_rate}
                onChange={(e) =>
                  setForm({
                    ...form,
                    default_monthly_rate: parseFloat(e.target.value) || 0,
                  })
                }
                min={0}
                step={0.01}
                required
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
              className="flex-1 py-4 bg-[#0a2342] text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} /> {submitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
