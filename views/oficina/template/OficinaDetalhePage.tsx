'use client';
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "../../../contexts/AppContext";
import { Document, MaintenanceRecord } from "../../../types";
import { supabaseWorkshopDocumentsApi } from "../../../database/api/supabase/workshopDocuments";
import {
  ArrowLeft,
  Wrench,
  CheckCircle,
  Camera,
  Trash2,
  X,
} from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useFinanceAccess } from "../../../hooks/useFinanceAccess";

function MaintenancePhotos({ record }: { record: MaintenanceRecord }) {
  const [photos, setPhotos] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabaseWorkshopDocumentsApi
      .getByMaintenance(record.id)
      .then(setPhotos)
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [record.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const created = await supabaseWorkshopDocumentsApi.uploadAndCreate(record.id, file);
        setPhotos((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error('Erro ao enviar foto:', err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (doc: Document) => {
    setDeleting(doc.id);
    try {
      await supabaseWorkshopDocumentsApi.delete(doc);
      setPhotos((prev) => prev.filter((d) => d.id !== doc.id));
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="mt-3">
      {loading ? (
        <p className="text-xs text-slate-400">Carregando fotos...</p>
      ) : photos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <button
                onClick={() => setLightbox(photo.file_url)}
                className="block rounded-lg overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors"
              >
                <img
                  src={photo.file_url}
                  alt="Foto manutenção"
                  className="w-20 h-20 object-cover"
                />
              </button>
              <button
                onClick={() => handleDelete(photo)}
                disabled={deleting === photo.id}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

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
}

export const OficinaDetalhePage: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { vehicles, maintenanceRecords } = useAppContext();
  const hasFinanceAccess = useFinanceAccess();

  const vehicle = vehicles.find((v) => v.id === id);
  const vehicleRecords = maintenanceRecords
    .filter((r) => r.vehicle_id === id)
    .sort(
      (a, b) =>
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
    );

  if (!vehicle) {
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
            Veículo não encontrado.
          </p>
        </div>
      </div>
    );
  }

  const statusColor = vehicle.vehicleStatus?.color || "#6b7280";
  const statusName = vehicle.vehicleStatus?.name || "Desconhecido";

  const activeRecords = vehicleRecords.filter((r) => r.status === "OPEN");
  const completedRecords = vehicleRecords.filter((r) => r.status === "COMPLETED");

  return (
    <div className="space-y-8">
      <ModuleHeader
        title={vehicle.plate}
        subtitle={`Histórico de manutenções da moto ${vehicle.model?.name || 'Moto'}.`}
        breadcrumbs={[
          { label: "Oficina", href: "/oficina" },
          { label: vehicle.plate }
        ]}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-brand-blue">
          <h3 className="font-bold text-white text-sm uppercase tracking-tight">
            Informações do Veículo
          </h3>
        </div>
        <ul className="divide-y divide-slate-100">
          <li className="flex items-center justify-between px-6 py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Placa</span>
            <span className="font-bold text-slate-700 font-mono">{vehicle.plate}</span>
          </li>
          <li className="flex items-center justify-between px-6 py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Modelo</span>
            <span className="font-bold text-slate-700">{vehicle.model?.name || '—'}</span>
          </li>
          <li className="flex items-center justify-between px-6 py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quilometragem</span>
            <span className="font-bold text-slate-700">{vehicle.mileage.toLocaleString()} km</span>
          </li>
          <li className="flex items-center justify-between px-6 py-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status</span>
            <span
              className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
              style={{
                backgroundColor: `${statusColor}20`,
                color: statusColor,
                borderColor: `${statusColor}40`,
              }}
            >
              {statusName}
            </span>
          </li>
        </ul>
      </div>

      {/* Active Maintenance */}
      {activeRecords.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 bg-amber-500">
            <Wrench size={16} className="text-white" />
            <h3 className="flex-1 font-bold text-white text-sm uppercase tracking-tight">
              Manutenção em Andamento
            </h3>
          </div>
          <ul className="divide-y divide-slate-100">
            <li className="flex items-center justify-between px-6 py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mecânico</span>
              <span className="font-bold text-slate-700">{activeRecords[0].mechanic_name || '—'}</span>
            </li>
            <li className="flex items-center justify-between px-6 py-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Entrada</span>
              <span className="font-bold text-slate-700">
                {new Date(activeRecords[0].entry_date).toLocaleDateString()}
              </span>
            </li>
            {activeRecords[0].description && (
              <li className="flex items-center justify-between px-6 py-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Observações</span>
                <span className="text-sm text-slate-600 max-w-xs text-right truncate">{activeRecords[0].description}</span>
              </li>
            )}
          </ul>
          <div className="px-6 py-4">
            <Link
              href={`/oficina/manutencao/${activeRecords[0].id}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-colors"
            >
              <Wrench size={15} /> Ver detalhes da manutenção
            </Link>
          </div>
        </div>
      )}

      {/* Completed History Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex items-center bg-brand-blue gap-3 px-6 py-4 border-b border-slate-100">
          <CheckCircle size={16} className="text-white" />
          <h3 className="font-bold text-white uppercase tracking-tight text-sm">
            Histórico Concluído
          </h3>
          <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {completedRecords.length}
          </span>
        </div>
        {completedRecords.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-medium text-sm">
            Nenhuma manutenção concluída.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Mecânico</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Observação</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Entrada</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Conclusão</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Fotos</th>
                  {hasFinanceAccess && <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Custo</th>}
                </tr>
              </thead>
              <tbody>
                {completedRecords.map((record) => (
                  <tr key={record.id} onClick={() => router.push(`/oficina/manutencao/${record.id}`)} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-slate-600 font-medium">{record.mechanic_name || '—'}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{record.description || '—'}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      {new Date(record.entry_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      {record.completion_date ? new Date(record.completion_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <MaintenancePhotos record={record} />
                    </td>
                    {hasFinanceAccess && (
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {record.cost > 0 ? `R$ ${record.cost.toFixed(2)}` : '—'}
                      </td>
                    )}
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
