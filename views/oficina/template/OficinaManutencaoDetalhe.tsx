'use client';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Document } from "../../../types";
import { useAppContext } from "../../../contexts/AppContext";
import { supabaseWorkshopDocumentsApi } from "../../../database/api/supabase/workshopDocuments";
import { localMaintenanceApi } from "../../../database/api/local/maintenance";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Pencil,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useFinanceAccess } from "../../../hooks/useFinanceAccess";
import { formatDate } from "../../../lib/formatters";

export const OficinaManutencaoDetalhe: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const {
    maintenanceRecords,
    vehicles,
    workshops,
    setMaintenanceRecords,
    handleFinishMaintenance,
  } = useAppContext();
  const hasFinanceAccess = useFinanceAccess();

  const record = maintenanceRecords.find((r) => r.id === id);
  const vehicle = vehicles.find((v) => v.id === record?.vehicle_id);
  const workshop = workshops.find((w) => w.id === record?.workshop_id);

  const [editing, setEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(
    record?.description ?? "",
  );
  const [editCost, setEditCost] = useState(String(record?.cost ?? 0));
  const [editMechanicName, setEditMechanicName] = useState(record?.mechanic_name ?? "");
  const [photos, setPhotos] = useState<Document[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!record) return;
    supabaseWorkshopDocumentsApi
      .getByMaintenance(record.id)
      .then(setPhotos)
      .catch(() => setPhotos([]))
      .finally(() => setLoadingPhotos(false));
  }, [record?.id]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      setNewFiles((prev) => [...prev, ...files]);
      setNewPreviews((prev) => [
        ...prev,
        ...files.map((f) => URL.createObjectURL(f)),
      ]);
      e.target.value = "";
    },
    [],
  );

  const removeNewFile = useCallback((i: number) => {
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
    setNewFiles((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const handleDeletePhoto = async (doc: Document) => {
    setDeleting(doc.id);
    try {
      await supabaseWorkshopDocumentsApi.delete(doc);
      setPhotos((prev) => prev.filter((d) => d.id !== doc.id));
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = async () => {
    if (!record) return;
    setSaving(true);
    try {
      const updated = await localMaintenanceApi.update(record.id, {
        description: editDescription,
        cost: parseFloat(editCost) || 0,
        mechanic_name: editMechanicName,
      });
      if (newFiles.length > 0) {
        const uploaded = await Promise.all(
          newFiles.map((f) =>
            supabaseWorkshopDocumentsApi.uploadAndCreate(record.id, f),
          ),
        );
        setPhotos((prev) => [...uploaded, ...prev]);
      }
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewFiles([]);
      setNewPreviews([]);
      setMaintenanceRecords((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      setEditing(false);
    } catch (err) {
      console.error("Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditDescription(record?.description ?? "");
    setEditCost(String(record?.cost ?? 0));
    setEditMechanicName(record?.mechanic_name ?? "");
    newPreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewFiles([]);
    setNewPreviews([]);
    setEditing(false);
  };

  const handleFinish = async () => {
    if (!record) return;
    setFinishing(true);
    try {
      await handleFinishMaintenance(record.id);
      router.push(`/oficina/${record.vehicle_id}`);
    } finally {
      setFinishing(false);
    }
  };

  if (!record || !vehicle) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/oficina")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar para Oficina
        </button>
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg">
            Manutenção não encontrada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ModuleHeader
        title={`Manutenção — ${vehicle.plate}`}
        subtitle={`${record.status === "COMPLETED" ? "Manutenção concluída" : "Manutenção em andamento"}${workshop ? ` · ${workshop.name}` : ""}.`}
        breadcrumbs={[
          { label: "Oficina", href: "/oficina" },
          { label: vehicle.plate, href: `/oficina/${vehicle.id}` },
          { label: `Manutenção · ${formatDate(record.entry_date)}` },
        ]}
      />

      {/* Vehicle info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-brand-blue">
          <h3 className="font-bold text-white text-sm uppercase tracking-tight">
            Informações do Veículo
          </h3>
        </div>
        <ul className="divide-y divide-slate-100">
          <li className="flex items-center justify-between px-6 py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Placa
            </span>
            <span className="font-bold text-slate-700 font-mono">
              {vehicle.plate}
            </span>
          </li>
          <li className="flex items-center justify-between px-6 py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Modelo
            </span>
            <span className="font-bold text-slate-700">
              {vehicle.model?.name || "—"}
            </span>
          </li>
          {workshop && (
            <li className="flex items-center justify-between px-6 py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Oficina
              </span>
              <span className="font-bold text-slate-700">{workshop.name}</span>
            </li>
          )}
        </ul>
      </div>

      {/* Maintenance detail */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className={`flex items-center gap-3 px-6 py-4 ${record.status === "COMPLETED" ? "bg-green-600" : "bg-amber-500"}`}>
          <Wrench size={16} className="text-white" />
          <h3 className="flex-1 font-bold text-white text-sm uppercase tracking-tight">
            {record.status === "COMPLETED" ? "Manutenção Concluída" : "Manutenção em Andamento"}
          </h3>
          {record.status === "OPEN" && !editing && (
            <>
              <button
                onClick={() => {
                  setEditDescription(record.description);
                  setEditCost(String(record.cost ?? 0));
                  setEditMechanicName(record.mechanic_name ?? "");
                  setEditing(true);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Pencil size={13} /> Editar
              </button>
              <button
                onClick={handleFinish}
                disabled={finishing}
                className="flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle size={13} />
                {finishing ? "Finalizando..." : "Finalizar"}
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            <li className="flex items-center justify-between px-5 py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Mecânico
              </span>
              {editing ? (
                <input
                  type="text"
                  className="w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 text-right"
                  value={editMechanicName}
                  onChange={(e) => setEditMechanicName(e.target.value)}
                  placeholder="Nome do mecânico"
                />
              ) : (
                <span className="font-bold text-slate-700">
                  {record.mechanic_name || "—"}
                </span>
              )}
            </li>
            <li className="flex items-center justify-between px-5 py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Data de Entrada
              </span>
              <span className="font-bold text-slate-700">
                {formatDate(record.entry_date)}
              </span>
            </li>
            {record.status === "COMPLETED" && record.completion_date && (
              <li className="flex items-center justify-between px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Conclusão
                </span>
                <span className="font-bold text-green-700">
                  {formatDate(record.completion_date)}
                </span>
              </li>
            )}
            {hasFinanceAccess && (
              <li className="flex items-center justify-between px-5 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Custo
                </span>
                {editing ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 text-right"
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                ) : (
                  <span className="font-bold text-slate-700">
                    {record.cost > 0 ? `R$ ${record.cost.toFixed(2)}` : "—"}
                  </span>
                )}
              </li>
            )}
            <li className="flex flex-col gap-2 px-5 py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Observações
              </span>
              {editing ? (
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 resize-none"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Descreva os serviços..."
                />
              ) : (
                <span className="text-sm text-slate-600">
                  {record.description || "—"}
                </span>
              )}
            </li>
          </ul>

          {/* Photos */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Fotos
            </span>
            <div className="mt-3 flex flex-wrap gap-3">
              {loadingPhotos ? (
                <p className="text-xs text-slate-400">Carregando fotos...</p>
              ) : (
                <>
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <button
                        onClick={() => setLightbox(photo.file_url)}
                        className="block rounded-xl overflow-hidden border border-slate-200 hover:border-amber-400 transition-colors"
                      >
                        <img
                          src={photo.file_url}
                          alt="Foto manutenção"
                          className="w-20 h-20 object-cover"
                        />
                      </button>
                      {record.status === "OPEN" && (
                        <button
                          onClick={() => handleDeletePhoto(photo)}
                          disabled={deleting === photo.id}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 disabled:opacity-30"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}

                  {editing &&
                    newPreviews.map((src, i) => (
                      <div key={`new-${i}`} className="relative">
                        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-amber-400">
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => removeNewFile(i)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}

                  {editing && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-colors"
                      >
                        <Camera size={18} />
                        <span className="text-[10px] font-medium">
                          Adicionar
                        </span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </>
                  )}

                  {!editing && photos.length === 0 && (
                    <p className="text-xs text-slate-400">
                      Nenhuma foto anexada.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Edit actions */}
          {record.status === "OPEN" && editing && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={28} />
          </button>
          <img
            src={lightbox}
            alt="Foto ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
