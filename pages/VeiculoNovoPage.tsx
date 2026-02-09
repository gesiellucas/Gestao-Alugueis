import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { vehiclesApi } from "../services/api";
import { ArrowLeft, Save } from "lucide-react";

export const VeiculoNovoPage: React.FC = () => {
  const navigate = useNavigate();
  const { setVehicles } = useAppContext();

  const [form, setForm] = useState({
    plate: "",
    model: "",
    brand: "Honda",
    year: new Date().getFullYear(),
    mileage: 0,
    image_url: "",
    default_monthly_rate: 800,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plate || !form.model) return;

    setSubmitting(true);
    setError(null);

    try {
      const newVehicle = await vehiclesApi.create({
        plate: form.plate,
        model: form.model,
        brand: form.brand,
        year: form.year,
        mileage: form.mileage,
        image_url: form.image_url || null,
        default_monthly_rate: form.default_monthly_rate,
      });

      setVehicles((prev) => [newVehicle, ...prev]);
      navigate("/veiculos");
    } catch (err) {
      console.error("Error creating vehicle:", err);
      setError("Erro ao cadastrar veículo. Verifique se a placa já não está cadastrada.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/veiculos")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <h2 className="text-3xl font-extrabold text-[#0a2342] uppercase tracking-tight">
          Nova Motocicleta
        </h2>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#0a2342] p-8">
          <h3 className="font-black text-xl uppercase tracking-tighter text-white">
            Cadastro de Veículo
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
                placeholder="ABC-1234"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Marca
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all border"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Honda"
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
                placeholder="CG 160 Fan"
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
                required
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
              URL da Imagem (Opcional)
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
              onClick={() => navigate("/veiculos")}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 bg-[#0a2342] text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} /> {submitting ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
