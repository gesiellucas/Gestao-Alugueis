'use client';
import React, { useState, useEffect } from "react";
import { VehicleModel } from "../../../types";
import { localVehicleModelsApi } from "../../../database/api/local/vehicleModels";
import { Car, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";

type FormData = { name: string; brand: string; status: 'ACTIVE' | 'INACTIVE' };

const EMPTY_FORM: FormData = { name: '', brand: '', status: 'ACTIVE' };

export const VehicleModelsTab: React.FC = () => {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const api = localVehicleModelsApi;

  const load = async () => {
    try {
      setLoading(true);
      setModels(await api.getAll());
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsCreating(true);
  };

  const openEdit = (m: VehicleModel) => {
    setIsCreating(false);
    setEditingId(m.id);
    setForm({ name: m.name, brand: m.brand, status: m.status });
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.brand.trim()) {
      alert('Preencha nome e marca.');
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await api.update(editingId, form);
      } else {
        await api.create(form);
      }
      cancelForm();
      await load();
    } catch (e) {
      alert('Erro ao salvar modelo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir este modelo de veículo?')) return;
    try {
      await api.delete(id);
      await load();
    } catch (e) {
      alert('Erro ao excluir modelo.');
    }
  };

  const showForm = isCreating || editingId !== null;

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Modelos de Veículos"
        subtitle="Gerencie os modelos de veículos disponíveis no sistema."
        breadcrumbs={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Modelos" }
        ]}
        extraHeader={
          !showForm && (
            <button
              onClick={openCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition"
            >
              Novo Modelo
            </button>
          )
        }
      />

      {showForm && (
        <div className="mb-8 p-6 bg-white border border-slate-200 rounded-2xl grid gap-4 grid-cols-1 md:grid-cols-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Modelo</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: CB 300"
              className="w-full border border-slate-300 rounded-xl p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marca</label>
            <input
              type="text"
              value={form.brand}
              onChange={e => setForm(prev => ({ ...prev, brand: e.target.value }))}
              placeholder="Ex: Honda"
              className="w-full border border-slate-300 rounded-xl p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))}
              className="w-full border border-slate-300 rounded-xl p-2 text-sm bg-white"
            >
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
            </select>
          </div>
          <div className="col-span-full flex justify-end gap-3 mt-2">
            <button
              onClick={cancelForm}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold flex items-center gap-1"
            >
              <X size={16} /> Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <Check size={16} /> {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        {loading ? (
          <p className="text-slate-400 text-sm font-medium py-6 text-center">Carregando...</p>
        ) : models.length === 0 ? (
          <p className="text-slate-400 text-sm font-medium py-6 text-center italic">Nenhum modelo cadastrado.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidde">
            <table className="w-full text-left">
              <thead className="bg-slate-800 text-white">
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold">Modelo</th>
                  <th className="py-4 px-6 font-bold">Marca</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {models.map(m => (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                    <td className="py-4 font-bold text-slate-700">{m.name}</td>
                    <td className="py-4 text-slate-500 text-sm">{m.brand}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {m.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(m)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
