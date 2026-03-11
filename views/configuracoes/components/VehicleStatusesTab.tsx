'use client';
import React, { useState, useEffect } from "react";
import { VehicleStatusRecord } from "../../../types";
import { localVehicleStatusesApi } from "../../../services/localApi/vehicleStatuses";
import { Palette, Plus, Edit2, Trash2, Check, X, Lock } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";

type FormData = { name: string; color: string };

const EMPTY_FORM: FormData = { name: '', color: '#6b7280' };

export const VehicleStatusesTab: React.FC = () => {
  const [statuses, setStatuses] = useState<VehicleStatusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setStatuses(await localVehicleStatusesApi.getAll());
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

  const openEdit = (s: VehicleStatusRecord) => {
    setIsCreating(false);
    setEditingId(s.id);
    setForm({ name: s.name, color: s.color });
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Preencha o nome do status.');
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await localVehicleStatusesApi.update(editingId, form);
      } else {
        await localVehicleStatusesApi.create(form);
      }
      cancelForm();
      await load();
    } catch (e) {
      alert('Erro ao salvar status.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: VehicleStatusRecord) => {
    if (s.is_default) {
      alert('Status padrão não pode ser excluído.');
      return;
    }
    if (!confirm(`Deseja excluir o status "${s.name}"?`)) return;
    try {
      await localVehicleStatusesApi.delete(s.id);
      await load();
    } catch (e) {
      alert('Erro ao excluir status.');
    }
  };

  const showForm = isCreating || editingId !== null;

  return (
    <div className="space-y-6">
      <ModuleHeader 
        title="Gestão de Status de Veículos" 
        subtitle="Gerencie os estados possíveis das motocicletas." 
        breadcrumbs={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Status" }
        ]}
        extraHeader={
        !showForm && (
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition"
          >
            Novo Status
          </button>
        )
      } />

      {showForm && (
        <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl grid gap-4 grid-cols-1 md:grid-cols-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Em Vistoria"
              className="w-full border border-slate-300 rounded-xl p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
              />
              <input
                type="text"
                value={form.color}
                onChange={e => setForm(prev => ({ ...prev, color: e.target.value }))}
                className="flex-1 border border-slate-300 rounded-xl p-2 text-sm font-mono"
              />
            </div>
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

      {loading ? (
        <p className="text-slate-400 text-sm font-medium py-6 text-center">Carregando...</p>
      ) : statuses.length === 0 ? (
        <p className="text-slate-400 text-sm font-medium py-6 text-center italic">Nenhum status cadastrado.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800 text-white">
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-widest p-6">
                <th className="py-4 px-6 font-bold">Cor</th>
                <th className="py-4 px-6 font-bold">Nome</th>
                <th className="py-4 px-6 font-bold">Tipo</th>
                <th className="py-4 px-6 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map(s => (
                <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                  <td className="py-4">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: s.color }}
                    />
                  </td>
                  <td className="py-4 font-bold text-slate-700">{s.name}</td>
                  <td className="py-4">
                    {s.is_default ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase">
                        <Lock size={10} /> Padrão
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase">
                        Personalizado
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      {!s.is_default && (
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
