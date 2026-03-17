'use client';
import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { Document, MaintenanceRecord } from "../../../types";
import { supabaseWorkshopDocumentsApi } from "../../../database/api/supabase/workshopDocuments";
import { Clock, CheckCircle, Camera, X, ImageIcon } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "../../../hooks/usePagination";
import { useFinanceAccess } from "../../../hooks/useFinanceAccess";

function PhotoCell({ record }: { record: MaintenanceRecord }) {
  const [photos, setPhotos] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPhotos = () => {
    if (loaded) return;
    setLoaded(true);
    supabaseWorkshopDocumentsApi
      .getByMaintenance(record.id)
      .then(setPhotos)
      .catch(() => setPhotos([]));
  };

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

  return (
    <div className="flex items-center gap-2" onMouseEnter={loadPhotos}>
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        title="Adicionar fotos"
      >
        <Camera size={14} />
        {uploading ? "..." : "Fotos"}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />

      {photos.length > 0 && (
        <div className="flex items-center gap-1">
          {photos.slice(0, 3).map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightbox(photo.file_url)}
              className="rounded overflow-hidden border border-slate-200 hover:border-blue-400 transition-colors"
            >
              <img src={photo.file_url} alt="" className="w-8 h-8 object-cover" />
            </button>
          ))}
          {photos.length > 3 && (
            <span className="text-xs text-slate-400 font-bold">+{photos.length - 3}</span>
          )}
        </div>
      )}

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

export const OficinaPage: React.FC = () => {
  const router = useRouter();
  const { maintenanceRecords: records, workshops, handleFinishMaintenance } =
    useAppContext();
  const hasFinanceAccess = useFinanceAccess();

  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string | "">("");

  const filteredRecords = selectedWorkshopId
    ? records.filter((r) => r.workshop_id === selectedWorkshopId)
    : records;

  const activeRecords = filteredRecords.filter((r) => r.status === "OPEN");
  const historyRecords = filteredRecords
    .filter((r) => r.status === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
    );

  const activePagination = usePagination(activeRecords, 10);
  const historyPagination = usePagination(historyRecords, 10);

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Oficina"
        subtitle="Controle de manutenção preventiva e corretiva."
        breadcrumbs={[{ label: "Oficina" }]}
        extraHeader={
          <Link
            href="/oficina/novo_entrada"
            className="bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-2 rounded-xl font-medium transition-all active:scale-95 flex items-center gap-2"
          >
            Registrar Entrada
          </Link>
        } />

      {/* Workshop Filter */}
      <div className="flex items-center gap-3">
        <select
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all appearance-none min-w-[220px]"
          value={selectedWorkshopId}
          onChange={(e) => setSelectedWorkshopId(e.target.value)}
        >
          <option value="">Todas as oficinas</option>
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Active Maintenance Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex bg-brand-blue items-center gap-3 px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-white uppercase tracking-tight text-sm">
            Em Manutenção Agora
          </h3>
          <span className="ml-auto bg-amber-500 text-white text-xs px-2.5 py-0.5 rounded-full">
            {activeRecords.length}
          </span>
        </div>
        {activeRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-sm">
            Nenhum veículo em manutenção no momento.
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Placa</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Mecânico</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Observação</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Entrada</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Fotos</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {activePagination.paginatedItems.map((record) => (
                  <tr key={record.id} onClick={() => router.push(`/oficina/${record.vehicle_id}`)} className="border-b border-slate-50 hover:bg-amber-50/40 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <span className="font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-lg text-sm uppercase tracking-tight">
                        {record.vehicle_plate}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#004AAD]">{record.type}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{record.mechanic_name}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{record.description}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {new Date(record.entry_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <PhotoCell record={record} />
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleFinishMaintenance(record.id)}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm shadow-green-100 uppercase text-xs tracking-widest flex items-center gap-1.5 ml-auto"
                      >
                        <CheckCircle size={14} />
                        Finalizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={activePagination.page}
            totalPages={activePagination.totalPages}
            total={activePagination.total}
            pageSize={activePagination.pageSize}
            onPageChange={activePagination.setPage}
            onPageSizeChange={activePagination.setPageSize}
          />
          </>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex bg-brand-blue items-center gap-3 px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-white uppercase tracking-tight text-sm">
            Histórico de Manutenções
          </h3>
          <span className="ml-auto bg-slate-200 text-slate-600 text-xs px-2.5 py-0.5 rounded-full">
            {historyRecords.length}
          </span>
        </div>
        {historyRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-sm">
            Nenhuma manutenção concluída ainda.
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Placa</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Mecânico</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Observação</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Concluído</th>
                  {hasFinanceAccess && <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Custo</th>}
                </tr>
              </thead>
              <tbody>
                {historyPagination.paginatedItems.map((record) => (
                  <tr key={record.id} onClick={() => router.push(`/oficina/${record.vehicle_id}`)} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg text-sm uppercase tracking-tight">
                        {record.vehicle_plate}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#004AAD]">{record.type}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{record.mechanic_name}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{record.description}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      {record.completion_date
                        ? new Date(record.completion_date).toLocaleDateString()
                        : "—"}
                    </td>
                    {hasFinanceAccess && (
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {record.cost != null
                          ? record.cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={historyPagination.page}
            totalPages={historyPagination.totalPages}
            total={historyPagination.total}
            pageSize={historyPagination.pageSize}
            onPageChange={historyPagination.setPage}
            onPageSizeChange={historyPagination.setPageSize}
          />
          </>
        )}
      </div>
    </div>
  );
};
