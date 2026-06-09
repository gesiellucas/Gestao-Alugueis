'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { localVehiclesApi } from "../../../database/api/local/vehicles";
import { localVehicleModelsApi } from "../../../database/api/local/vehicleModels";
import { ArrowLeft, Save, PlusCircle, Link } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";

export const VeiculoNovoPage: React.FC = () => {
  const router = useRouter();
  const { setVehicles, vehicleModels, setVehicleModels, vehicleStatusIds } = useAppContext();

  const [form, setForm] = useState<{
    plate: string;
    chassi: string;
    model_id: string | "";
    year: number;
    mileage: number;
    default_monthly_rate: number;
  }>({
    plate: "",
    chassi: "",
    model_id: "",
    year: new Date().getFullYear(),
    mileage: 0,
    default_monthly_rate: 800,
  });

  const [isCreatingModel, setIsCreatingModel] = useState(false);
  const [newModel, setNewModel] = useState({
    name: "",
    brand: "Honda",
    image_url: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plate) return;

    setSubmitting(true);
    setError(null);

    try {
      let finalModelId = form.model_id;

      if (isCreatingModel) {
        if (!newModel.name || !newModel.brand) {
          setError("Nome e marca do modelo são obrigatórios.");
          setSubmitting(false);
          return;
        }
        const createdModel = await localVehicleModelsApi.create({
          name: newModel.name,
          brand: newModel.brand,
          status: 'ACTIVE',
          image_url: newModel.image_url || null,
        });
        setVehicleModels(prev => [...prev, createdModel]);
        finalModelId = createdModel.id;
      }

      if (!finalModelId) {
        setError("Selecione ou crie um modelo de veículo.");
        setSubmitting(false);
        return;
      }

      const availableStatusId = vehicleStatusIds.AVAILABLE;
      if (!availableStatusId) {
        setError("Status 'Disponível' não encontrado no banco. Execute a migration e o seed.");
        setSubmitting(false);
        return;
      }

      const newVehicle = await localVehiclesApi.create({
        plate: form.plate,
        chassi: form.chassi || null,
        model_id: finalModelId as string,
        year: form.year,
        status_id: availableStatusId,
        mileage: form.mileage,
        default_monthly_rate: form.default_monthly_rate,
      });

      setVehicles((prev) => [newVehicle, ...prev]);
      router.push("/veiculos");
    } catch (err) {
      console.error('[VeiculoNovo] Erro ao criar veículo:', err);
      setError("Erro ao cadastrar veículo. Verifique se a placa já não está cadastrada.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Novo Veículo"
        subtitle="Cadastro de Veículo"
        breadcrumbs={[{ label: "Veículos" }]} />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-brand-blue p-4">
          <h3 className="font-bold  text-white">
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
                placeholder="ABC-1234"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Chassi
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
                value={form.chassi}
                onChange={(e) =>
                  setForm({ ...form, chassi: e.target.value.toUpperCase() })
                }
                placeholder="9C2JC3110MR000000"
                maxLength={17}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Modelo do Veículo
              </label>
              {!isCreatingModel ? (
                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border appearance-none"
                    value={form.model_id}
                    onChange={(e) => setForm({ ...form, model_id: e.target.value })}
                    required
                  >
                    <option value="">Selecione um modelo...</option>
                    {vehicleModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.brand})</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCreatingModel(true)}
                    className="px-4 bg-green-100 text-green-700 hover:bg-green-200 rounded-xl font-bold flex items-center justify-center transition-colors"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 border border-blue-500 bg-blue-50/50 p-3 rounded-xl">
                  <div className="flex flex-col gap-2 flex-1">
                    <input
                      type="text"
                      className="w-full bg-white border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#004AAD]"
                      value={newModel.name}
                      onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                      placeholder="Nome do Modelo (Ex: CG 160 Fan)"
                    />
                    <input
                      type="text"
                      className="w-full bg-white border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#004AAD]"
                      value={newModel.brand}
                      onChange={(e) => setNewModel({ ...newModel, brand: e.target.value })}
                      placeholder="Marca (Ex: Honda)"
                    />
                    <input
                      type="url"
                      className="w-full bg-white border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#004AAD]"
                      value={newModel.image_url}
                      onChange={(e) => setNewModel({ ...newModel, image_url: e.target.value })}
                      placeholder="URL da Imagem (Opicional)"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreatingModel(false)}
                    className="px-2 text-slate-400 hover:text-slate-600 font-bold flex items-start"
                  >
                    Cancelar
                  </button>
                </div>
              )}
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
                required
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
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Valor Contratual Padrão (R$)
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
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
              onClick={() => router.push("/veiculos")}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 bg-[#004AAD] text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Salvando..." : "Salvar Veículo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
