'use client';
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "../../../contexts/AppContext";
import { VEHICLE_STATUS_IDS, Document, UnavailableStatusType } from "../../../types";
import { supabaseDocumentsApi } from "../../../database/api/supabase/documents";
import { supabaseWorkshopDocumentsApi } from "../../../database/api/supabase/workshopDocuments";
import {
  ArrowLeft,
  Pencil,
  Hash,
  Circle,
  User,
  Calendar,
  Wrench,
  CheckCircle,
  KeyRound,
  XCircle,
  ChevronDown,
  ImageIcon,
  X,
  ShieldOff,
  ImagePlus,
  FileText,
} from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useFinanceAccess } from "../../../hooks/useFinanceAccess";
import { formatDate, formatPhone, toWhatsApp } from "../../../lib/formatters";

function PhotoCellReadOnly({ recordId }: { recordId: string }) {
  const [photos, setPhotos] = useState<Document[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadPhotos = () => {
    if (loaded) return;
    setLoaded(true);
    supabaseWorkshopDocumentsApi
      .getByMaintenance(recordId)
      .then(setPhotos)
      .catch(() => setPhotos([]));
  };

  return (
    <div className="flex items-center gap-1" onMouseEnter={loadPhotos}>
      {photos.length > 0 ? (
        <>
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
        </>
      ) : loaded ? (
        <span className="text-xs text-slate-300">—</span>
      ) : (
        <ImageIcon size={14} className="text-slate-300" />
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

export const VeiculoDetalhePage: React.FC = () => {
  const params = useParams();
  const id = (typeof window !== 'undefined' && (!params.id || params.id === 'placeholder') ? window.location.pathname.split('/').filter(Boolean).pop() : params.id) as string;
  const router = useRouter();
  const { vehicles, customers, maintenanceRecords, rentalContracts, unavailableVehicles, handleEndRental, handleMakeVehicleUnavailable, loading } =
    useAppContext();
  const [endingRental, setEndingRental] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  // Unavailable modal state
  const [unavailableOpen, setUnavailableOpen] = useState(false);
  const [unavailableType, setUnavailableType] = useState<UnavailableStatusType>('STOLEN');
  const [unavailableReason, setUnavailableReason] = useState('');
  const [unavailableFiles, setUnavailableFiles] = useState<File[]>([]);
  const [unavailablePreviews, setUnavailablePreviews] = useState<string[]>([]);
  const [submittingUnavailable, setSubmittingUnavailable] = useState(false);
  const unavailableInputRef = React.useRef<HTMLInputElement>(null);

  // Unavailable vehicle docs/photos
  const [unavailableDocs, setUnavailableDocs] = useState<Document[]>([]);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const hasFinanceAccess = useFinanceAccess();
  const vehicle = vehicles.find((v) => v.id === id);
  const unavailableRecord = unavailableVehicles.find((uv) => uv.vehicle_id === id);
  const isUnavailable = vehicle?.vehicleStatus?.name === 'Roubada' || vehicle?.vehicleStatus?.name === 'PT';

  // Load unavailable vehicle documents (must be before early return)
  useEffect(() => {
    if (unavailableRecord) {
      supabaseDocumentsApi
        .getByParent(unavailableRecord.id, 'UNAVAILABLE_VEHICLE')
        .then(setUnavailableDocs)
        .catch(() => setUnavailableDocs([]));
    }
  }, [unavailableRecord?.id]);

  if (loading || !vehicle) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/veiculos")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar para Frota
        </button>
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg">
            {loading ? "Carregando..." : "Veículo não encontrado."}
          </p>
        </div>
      </div>
    );
  }

  const renter = vehicle.current_renter_id
    ? customers.find((c) => c.id === vehicle.current_renter_id)
    : null;
  const vehicleRecords = maintenanceRecords
    .filter((r) => r.vehicle_id === vehicle.id)
    .sort(
      (a, b) =>
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
    );

  const activeContract = rentalContracts.find(
    (c) => c.vehicle_id === vehicle.id && c.status === "ACTIVE",
  );

  const vehicleRentals = rentalContracts
    .filter((c) => c.vehicle_id === vehicle.id)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const statusColor = vehicle.vehicleStatus?.color || "#6b7280";
  const statusName = vehicle.vehicleStatus?.name || "Desconhecido";

  const onEndRental = async () => {
    setEndingRental(true);
    try {
      await handleEndRental(vehicle.id);
      setShowEndConfirm(false);
    } catch {
      // error handled in context
    } finally {
      setEndingRental(false);
    }
  };

  // Unavailable handlers
  const handleUnavailableFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    if (!newFiles.length) return;
    setUnavailableFiles((prev) => {
      const combined = [...prev, ...newFiles];
      setUnavailablePreviews(combined.map((f) => URL.createObjectURL(f)));
      return combined;
    });
    e.target.value = "";
  };

  const removeUnavailableFile = (index: number) => {
    setUnavailableFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setUnavailablePreviews(next.map((f) => URL.createObjectURL(f)));
      return next;
    });
  };

  const resetUnavailableModal = () => {
    setUnavailableOpen(false);
    setUnavailableType('STOLEN');
    setUnavailableReason('');
    setUnavailableFiles([]);
    setUnavailablePreviews([]);
  };

  const handleConfirmUnavailable = async () => {
    if (!unavailableReason.trim()) return;
    setSubmittingUnavailable(true);
    try {
      const record = await handleMakeVehicleUnavailable(vehicle.id, unavailableType, unavailableReason.trim());

      if (unavailableFiles.length > 0) {
        await Promise.all(
          unavailableFiles.map((file) =>
            supabaseDocumentsApi.uploadAndCreate(record.id, file, 'UNAVAILABLE_VEHICLE')
          )
        );
      }

      router.push('/veiculos');
    } finally {
      setSubmittingUnavailable(false);
      resetUnavailableModal();
    }
  };

  return (
    <div className="space-y-8">

      <ModuleHeader
        title={`${vehicle.plate}`}
        subtitle={vehicle.model?.name || 'Moto'}
        breadcrumbs={[
          { label: "Veículos", href: "/veiculos" },
          { label: vehicle.plate }
        ]}
        extraHeader={<div className="relative">
          <button
            onClick={() => setActionsOpen((v) => !v)}
            className="bg-[#004AAD] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#003a8c] transition-all flex items-center gap-2 text-sm"
          >
            Ações <ChevronDown size={16} className={`transition-transform ${actionsOpen ? 'rotate-180' : ''}`} />
          </button>
          {actionsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setActionsOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1 overflow-hidden">
                {vehicle.status_id === VEHICLE_STATUS_IDS.AVAILABLE && !isUnavailable && (
                  <Link
                    href={`/aluguel/novo/${vehicle.id}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-50 transition-colors"
                    onClick={() => setActionsOpen(false)}
                  >
                    <KeyRound size={16} /> Alugar Moto
                  </Link>
                )}
                {vehicle.status_id === VEHICLE_STATUS_IDS.RENTED && (
                  <button
                    onClick={() => { setShowEndConfirm(true); setActionsOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <XCircle size={16} /> Encerrar Contrato
                  </button>
                )}
                {vehicle.status_id !== VEHICLE_STATUS_IDS.MAINTENANCE && !isUnavailable && (
                  <Link
                    href={`/oficina/novo_entrada?plate=${vehicle.plate}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
                    onClick={() => setActionsOpen(false)}
                  >
                    <Wrench size={16} /> Enviar para Oficina
                  </Link>
                )}
                <Link
                  href={`/veiculo/editar/${vehicle.id}`}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  onClick={() => setActionsOpen(false)}
                >
                  <Pencil size={16} /> Editar Veículo
                </Link>
                {!isUnavailable && (
                  <button
                    onClick={() => { setActionsOpen(false); setUnavailableOpen(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-colors"
                  >
                    <ShieldOff size={16} /> Indisponível
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        } />

      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-extrabold text-[#004AAD]">
              Encerrar Contrato
            </h3>
            <p className="text-slate-600">
              Tem certeza que deseja encerrar o contrato de aluguel
              {renter && (
                <span className="font-bold"> de {renter.name}</span>
              )}{" "}
              para o veículo{" "}
              <span className="font-bold font-mono">{vehicle.plate}</span>?
            </p>
            {activeContract && (
              <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
                <p className="text-slate-500">
                  <span className="font-bold text-slate-700">Início:</span>{" "}
                  {formatDate(activeContract.start_date)}
                </p>
                {hasFinanceAccess && (
                  <p className="text-slate-500">
                    <span className="font-bold text-slate-700">Valor Contratual:</span>{" "}
                    R$ {activeContract.monthly_rate.toFixed(2)}
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                disabled={endingRental}
                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onEndRental}
                disabled={endingRental}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {endingRental ? "Encerrando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center bg-brand-blue gap-3 px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-white text-sm">
            Informações do Veículo
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8 flex flex-col justify-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded uppercase">
                  {vehicle.model?.brand || "Marca"}
                </span>
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
              </div>
              <h2 className="text-3xl font-extrabold text-[#004AAD] leading-tight">
                {vehicle.model?.name || "Modelo"}
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Hash size={12} /> Placa
                </span>
                <span className="font-bold text-slate-700 font-mono tracking-tight">{vehicle.plate}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar size={12} /> Ano
                </span>
                <span className="font-bold text-slate-700">{vehicle.year}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Circle size={12} /> Quilometragem
                </span>
                <span className="font-bold text-slate-700">{vehicle.mileage.toLocaleString()} km</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <User size={12} /> Locatário
                </span>
                {renter ? (
                  <Link
                    href={`/cliente/${renter.id}`}
                    className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {renter.name}
                  </Link>
                ) : (
                  <span className="font-bold text-slate-400">Nenhum</span>
                )}
              </div>
              {renter && (
                <div className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <User size={12} /> Telefone
                  </span>
                  <span className="font-bold text-slate-700">{formatPhone(renter.phone)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção Veículo Indisponível */}
      {isUnavailable && unavailableRecord && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100" style={{ backgroundColor: statusColor }}>
            <ShieldOff size={16} className="text-white" />
            <h3 className="font-bold text-white text-sm">
              Veículo Indisponível
            </h3>
            <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest">
              {unavailableRecord.status_type === 'STOLEN' ? 'Roubada' : 'Perda Total'}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Info */}
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <ShieldOff size={12} /> Tipo
                </span>
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border"
                  style={{
                    backgroundColor: `${statusColor}20`,
                    color: statusColor,
                    borderColor: `${statusColor}40`,
                  }}
                >
                  {unavailableRecord.status_type === 'STOLEN' ? 'Roubada' : 'Perda Total (PT)'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar size={12} /> Data do registro
                </span>
                <span className="font-bold text-slate-700">
                  {formatDate(unavailableRecord.created_at)}
                </span>
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Descrição do ocorrido</p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 font-medium leading-relaxed">
                {unavailableRecord.reason}
              </div>
            </div>

            {/* Fotos e documentos */}
            {unavailableDocs.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Fotos e documentos ({unavailableDocs.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {unavailableDocs.map((doc) => {
                    const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(doc.file_url);
                    return (
                      <button
                        key={doc.id}
                        onClick={() => isImage ? setLightboxUrl(doc.file_url) : window.open(doc.file_url, '_blank')}
                        className="group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-blue-400 transition-colors relative"
                      >
                        {isImage ? (
                          <img src={doc.file_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                            <FileText size={24} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Documento</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox para fotos do episódio */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={28} />
          </button>
          <img
            src={lightboxUrl}
            alt="Foto ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Rental History Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex items-center bg-brand-blue gap-3 px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-white text-sm">
            Histórico de Aluguéis
          </h3>
          <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
            {vehicleRentals.length}
          </span>
        </div>
        {vehicleRentals.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-medium text-sm">
            Nenhum aluguel registrado para este veículo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Início</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Término</th>
                  {hasFinanceAccess && <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Valor/mês</th>}
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Situação</th>
                </tr>
              </thead>
              <tbody>
                {vehicleRentals.map((contract) => {
                  const contractCustomer = customers.find((c) => c.id === contract.customer_id);
                  return (
                    <tr key={contract.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        {contractCustomer ? (
                          <Link
                            href={`/cliente/${contractCustomer.id}`}
                            className="font-bold text-[#004AAD] hover:text-blue-600 transition-colors"
                          >
                            {contractCustomer.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {formatDate(contract.start_date)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {contract.end_date ? formatDate(contract.end_date) : "—"}
                      </td>
                      {hasFinanceAccess && (
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {contract.monthly_rate.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        {contract.status === "ACTIVE" ? (
                          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-green-200 inline-flex items-center gap-1">
                            <CheckCircle size={10} /> Ativo
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            Encerrado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance History Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex items-center bg-brand-blue gap-3 px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-white text-sm">
            Histórico de Manutenção
          </h3>
          <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {vehicleRecords.length}
          </span>
        </div>
        {vehicleRecords.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-medium text-sm">
            Nenhuma manutenção registrada para este veículo.
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
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Situação</th>
                </tr>
              </thead>
              <tbody>
                {vehicleRecords.map((record) => (
                  <tr key={record.id} onClick={() => router.push(`/oficina/${record.vehicle_id}`)} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-slate-600 font-medium">{record.mechanic_name || '—'}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{record.description || '—'}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      {formatDate(record.entry_date)}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      {record.completion_date ? formatDate(record.completion_date) : '—'}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <PhotoCellReadOnly recordId={record.id} />
                    </td>
                    <td className="px-6 py-4">
                      {record.status === "OPEN" ? (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-200 inline-flex items-center gap-1">
                          <Wrench size={10} /> Em andamento
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border border-green-200 inline-flex items-center gap-1">
                          <CheckCircle size={10} /> Concluído
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modal indisponível (Roubada / PT) */}
      {unavailableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <ShieldOff size={22} className="text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Marcar como Indisponível</p>
                <p className="text-sm text-slate-500">O veículo será removido da frota ativa.</p>
              </div>
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Motivo da indisponibilidade</p>
              <div className="flex gap-2">
                {([
                  { value: 'STOLEN' as UnavailableStatusType, label: 'Roubada', color: 'purple' },
                  { value: 'TOTAL_LOSS' as UnavailableStatusType, label: 'Perda Total (PT)', color: 'slate' },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUnavailableType(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                      unavailableType === opt.value
                        ? opt.color === 'purple'
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-slate-700 bg-slate-50 text-slate-800'
                        : 'border-slate-200 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição do ocorrido</p>
              <textarea
                value={unavailableReason}
                onChange={(e) => setUnavailableReason(e.target.value)}
                rows={3}
                placeholder="Descreva o motivo da indisponibilidade..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Fotos / documentos */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fotos e documentos (opcional)</p>
              <button
                type="button"
                onClick={() => unavailableInputRef.current?.click()}
                disabled={submittingUnavailable}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/40 transition-colors disabled:opacity-50"
              >
                <ImagePlus size={16} />
                Adicionar arquivos
              </button>
              <input
                ref={unavailableInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                className="hidden"
                onChange={handleUnavailableFileChange}
              />
              {unavailablePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {unavailablePreviews.map((src, i) => {
                    const file = unavailableFiles[i];
                    const isImg = file?.type.startsWith('image/');
                    return (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        {isImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText size={20} className="text-slate-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeUnavailableFile(i)}
                          disabled={submittingUnavailable}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={resetUnavailableModal}
                disabled={submittingUnavailable}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUnavailable}
                disabled={submittingUnavailable || !unavailableReason.trim()}
                className="flex-1 py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {submittingUnavailable
                  ? unavailableFiles.length > 0
                    ? 'Enviando arquivos...'
                    : 'Processando...'
                  : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
