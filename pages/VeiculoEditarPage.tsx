import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { VehicleStatus } from "../types";
import { ArrowLeft, Save } from "lucide-react";

export const VeiculoEditarPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, setVehicles } = useAppContext();

  const vehicle = vehicles.find((v) => v.id === id);

  const [form, setForm] = useState({
    plate: vehicle?.plate || "",
    model: vehicle?.model || "",
    year: vehicle?.year || new Date().getFullYear(),
    mileage: vehicle?.mileage || 0,
    status: vehicle?.status || VehicleStatus.AVAILABLE,
    image_url: vehicle?.image_url || "",
    default_monthly_rate: vehicle?.default_monthly_rate || 800,
  });

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/veiculos")}
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              plate: form.plate,
              model: form.model,
              year: form.year,
              mileage: form.mileage,
              status: form.status,
              image_url: form.image_url || undefined,
              default_monthly_rate: form.default_monthly_rate,
            }
          : v,
      ),
    );
    navigate(`/veiculo/${id}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/veiculo/${id}`)}
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
            {vehicle.plate} - {vehicle.model}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
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
              <input
                type="text"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all border"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                required
              />
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
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              URL da Imagem
            </label>
            <input
              type="url"
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all border"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://exemplo.com/imagem.png"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => navigate(`/veiculo/${id}`)}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-[#0a2342] text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} /> Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
