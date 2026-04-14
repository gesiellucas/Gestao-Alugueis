'use client';
import React, { useState, useEffect } from "react";
import { VehicleStatusRecord } from "../../../types";
import { localVehicleStatusesApi } from "../../../database/api/local/vehicleStatuses";
import { Palette, Plus, Edit2, Trash2, Check, X, Lock } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "../../../hooks/usePagination";

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
  const pagination = usePagination(statuses, 10);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Gestão de Status de Veículos"
        subtitle="Gerencie os estados possíveis das motocicletas."
        breadcrumbs={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Status" }
        ]}
        extraHeader={null} />

      {loading ? (
        <p className="text-slate-400 text-sm font-medium py-6 text-center">Carregando...</p>
      ) : statuses.length === 0 ? (
        <p className="text-slate-400 text-sm font-medium py-6 text-center italic">Nenhum status cadastrado.</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-brand-blue text-white">
                <tr className="[&>th]:px-6 [&>th]:py-4 [&>th]:text-left [&>th]:text-xs [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-widest">
                  <th>Cor</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paginatedItems.map(s => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                    <td className="p-4">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                        style={{ backgroundColor: s.color }}
                      />
                    </td>
                    <td className="p-4 font-medium text-slate-700">{s.name}</td>
                    <td className="p-4">
                      {s.is_default ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                          <Lock size={10} /> Padrão
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                          Personalizado
                        </span>
                      )}
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
