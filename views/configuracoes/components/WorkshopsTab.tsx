'use client';
import React, { useState, useEffect } from "react";
import { Workshop } from "../../../types";
import { localWorkshopsApi } from "../../../database/api/local/workshops";
import { Building2, Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "../../../hooks/usePagination";

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
  const pagination = usePagination(workshops, 10);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Gestão de Oficinas"
        subtitle="Gerencie as oficinas disponíveis no sistema."
        breadcrumbs={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Oficinas" }
        ]}
        extraHeader={
          !showForm && (
            <button
              onClick={openCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition"
            >
              Nova Oficina
            </button>
          )
        } />
      <div className="flex justify-between items-center my-4">
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
      </div>



      {loading ? (
        <p className="text-slate-400 text-sm font-medium py-6 text-center">Carregando...</p>
      ) : workshops.length === 0 ? (
        <p className="text-slate-400 text-sm font-medium py-6 text-center italic">Nenhuma oficina cadastrada.</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left p-6">
              <thead className="bg-brand-blue text-white">
                <tr className="[&>th]:px-6 [&>th]:py-4 [&>th]:text-left [&>th]:text-xs [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-widest">
                  <th>Nome</th>
                  <th>Endereço</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paginatedItems.map(w => (
                  <tr key={w.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                    <td className="p-4 font-medium text-slate-700">{w.name}</td>
                    <td className="p-4 text-slate-500 text-sm">{w.address || '—'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${w.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {w.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2">
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
          <TablePagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </>
      )}
    </div>
  );
};
