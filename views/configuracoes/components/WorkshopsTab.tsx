'use client';
import React, { useState, useEffect } from "react";
import { Workshop } from "../../../types";
import { localWorkshopsApi } from "../../../services/localApi/workshops";
import { Building2, Plus, Edit2, Trash2, Check, X } from "lucide-react";

type FormData = { name: string; address: string; status: 'ACTIVE' | 'INACTIVE' };

const EMPTY_FORM: FormData = { name: '', address: '', status: 'ACTIVE' };

export const WorkshopsTab: React.FC = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setWorkshops(await localWorkshopsApi.getAll());
    } catch {
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

  const openEdit = (w: Workshop) => {
    setIsCreating(false);
    setEditingId(w.id);
    setForm({ name: w.name, address: w.address || '', status: w.status });
  };

  const cancelForm = () => {
    setIsCreating(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Informe o nome da oficina.');
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await localWorkshopsApi.update(editingId, {
          name: form.name,
          address: form.address || undefined,
          status: form.status,
        });
      } else {
        await localWorkshopsApi.create({
          name: form.name,
          address: form.address || undefined,
          status: form.status,
        });
      }
      cancelForm();
      await load();
    } catch {
      alert('Erro ao salvar oficina.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta oficina?')) return;
    try {
      await localWorkshopsApi.delete(id);
      await load();
    } catch {
      alert('Erro ao excluir oficina.');
    }
  };

  const showForm = isCreating || editingId !== null;

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-amber-100 p-3 rounded-xl text-amber-600">
            <Building2 size={24} />
          </div>
          <h3 className="text-xl font-black text-[#1a4fd6] uppercase">Gestão de Oficinas</h3>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition"
          >
            <Plus size={16} /> Nova Oficina
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl grid gap-4 grid-cols-1 md:grid-cols-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Oficina</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Mecânica do João"
              className="w-full border border-slate-300 rounded-xl p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Ex: Rua das Flores, 123"
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
              <option value="ACTIVE">Ativa</option>
              <option value="INACTIVE">Inativa</option>
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

      {loading ? (
        <p className="text-slate-400 text-sm font-medium py-6 text-center">Carregando...</p>
      ) : workshops.length === 0 ? (
        <p className="text-slate-400 text-sm font-medium py-6 text-center italic">Nenhuma oficina cadastrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-widest">
                <th className="py-4 font-bold">Nome</th>
                <th className="py-4 font-bold">Endereço</th>
                <th className="py-4 font-bold">Status</th>
                <th className="py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {workshops.map(w => (
                <tr key={w.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                  <td className="py-4 font-bold text-slate-700">{w.name}</td>
                  <td className="py-4 text-slate-500 text-sm">{w.address || '—'}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${w.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {w.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(w)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(w.id)}
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
  );
};
