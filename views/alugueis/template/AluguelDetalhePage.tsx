'use client';
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "../../../contexts/AppContext";
import { Document } from "../../../types";
import { supabaseContractsApi } from "../../../database/api/supabase/contracts";
import { supabaseDocumentsApi } from "../../../database/api/supabase/documents";
import {
  ArrowLeft,
  Bike,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  Trash2,
  Upload,
  ExternalLink,
  ChevronDown,
  XCircle,
  Pencil,
  ImagePlus,
  X,
  Play,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useFinanceAccess } from "../../../hooks/useFinanceAccess";
import { formatCPF, formatPhone, formatDate, toWhatsApp } from "../../../lib/formatters";

type Tab = "aluguel" | "contrato";

function getFileName(url: string) {
  return url.split(/[\\/]/).pop() || url;
}

function getFileExt(url: string) {
  return (url.split(".").pop()?.split("?")[0] || "").toLowerCase();
}

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "heic", "avif"];
const VIDEO_EXTS = ["mp4", "mov", "avi", "mkv", "webm", "m4v"];

function isImage(ext: string) { return IMAGE_EXTS.includes(ext); }
function isVideo(ext: string) { return VIDEO_EXTS.includes(ext); }
function isMedia(ext: string) { return isImage(ext) || isVideo(ext); }

function FileIcon({ ext }: { ext: string }) {
  const colors: Record<string, string> = {
    pdf: "text-red-500",
    png: "text-blue-500",
    jpg: "text-blue-500",
    jpeg: "text-blue-500",
    doc: "text-blue-700",
    docx: "text-blue-700",
  };
  return <FileText size={20} className={colors[ext] || "text-slate-400"} />;
}

export const AluguelDetalhePage: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { rentalContracts, customers, vehicles, handleEndRental, handleUpdateRental } = useAppContext();
  const hasFinanceAccess = useFinanceAccess();
  const [activeTab, setActiveTab] = useState<Tab>("aluguel");

  // Action dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Finalization images
  const [finalizationFiles, setFinalizationFiles] = useState<File[]>([]);
  const [finalizationPreviews, setFinalizationPreviews] = useState<string[]>([]);
  const finalizationInputRef = useRef<HTMLInputElement>(null);

  // Media lightbox
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editMonthlyRate, setEditMonthlyRate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contractId, setContractId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const mediaFiles = documents.filter((d) => isMedia(getFileExt(d.file_url)));
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
      if (e.key === 'ArrowRight' && lightboxIndex < mediaFiles.length - 1) setLightboxIndex(lightboxIndex + 1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [lightboxIndex, documents]);

  const rental = rentalContracts.find((c) => c.id === id);

  // Ao abrir a aba de documentos, busca o contrato vinculado ao aluguel
  useEffect(() => {
    if (!rental) return;
    supabaseContractsApi
      .getByRental(rental.id)
      .then((c) => setContractId(c?.id ?? null))
      .catch(() => setContractId(null));
  }, [rental?.id]);

  // Carrega documentos sempre que o contractId for resolvido
  useEffect(() => {
    if (!contractId) { setDocuments([]); return; }
    setDocsLoading(true);
    supabaseDocumentsApi
      .getByContract(contractId)
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setDocsLoading(false));
  }, [contractId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !rental) return;

    setUploading(true);
    setUploadError(null);
    try {
      // Garante que o contrato existe — cria automaticamente se necessário
      const contract = await supabaseContractsApi.ensureForRental(rental);
      setContractId(contract.id);

      const created = await supabaseDocumentsApi.uploadAndCreate(contract.id, file);
      setDocuments((prev) => [created, ...prev]);
    } catch (err) {
      console.error(err);
      setUploadError("Erro ao enviar arquivo. Tente novamente.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (doc: Document) => {
    setDeleting(doc.id);
    try {
      await supabaseDocumentsApi.delete(doc);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = () => {
    setEditStartDate(rental?.start_date ?? '');
    setEditMonthlyRate(String(rental?.monthly_rate ?? ''));
    setEditOpen(true);
    setDropdownOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!rental) return;
    setSaving(true);
    try {
      await handleUpdateRental(rental.id, {
        start_date: editStartDate,
        monthly_rate: parseFloat(editMonthlyRate),
      });
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files ?? []);
    if (!newFiles.length) return;
    setFinalizationFiles((prev) => {
      const combined = [...prev, ...newFiles];
      const previews = combined.map((f) => URL.createObjectURL(f));
      setFinalizationPreviews(previews);
      return combined;
    });
    e.target.value = "";
  };

  const removeFinalizationFile = (index: number) => {
    setFinalizationFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setFinalizationPreviews(next.map((f) => URL.createObjectURL(f)));
      return next;
    });
  };

  const handleConfirmEnd = async () => {
    if (!rental) return;
    setEnding(true);
    try {
      if (finalizationFiles.length > 0) {
        const contract = await supabaseContractsApi.ensureForRental(rental);
        setContractId(contract.id);
        const uploaded = await Promise.all(
          finalizationFiles.map((file) =>
            supabaseDocumentsApi.uploadAndCreate(contract.id, file)
          )
        );
        setDocuments((prev) => [...uploaded, ...prev]);
      }
      await handleEndRental(rental.vehicle_id);
      router.push('/alugueis');
    } finally {
      setEnding(false);
      setConfirmEnd(false);
      setFinalizationFiles([]);
      setFinalizationPreviews([]);
    }
  };

  if (!rental) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/alugueis")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar para Aluguéis
        </button>
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
          <p className="text-slate-500 font-medium text-lg">Contrato não encontrado.</p>
        </div>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === rental.customer_id);
  const vehicle = vehicles.find((v) => v.id === rental.vehicle_id);

  const startDate = new Date(rental.start_date);
  const endDate = rental.end_date ? new Date(rental.end_date) : null;
  const now = new Date();
  const diffMs = (endDate ?? now).getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;
  const duration = `${months}m ${days}d`;

  const isActive = rental.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <ModuleHeader
        title={`Contrato ${id}`}
        subtitle="Detalhes do aluguel e documentos vinculados."
        breadcrumbs={[
          { label: "Aluguéis", href: "/alugueis" },
          { label: String(id) }
        ]}
        extraHeader={
          isActive ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(o => !o)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
              >
                Ações
                <ChevronDown size={15} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={openEdit}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Pencil size={15} />
                    Editar
                  </button>
                  <button
                    onClick={() => { setDropdownOpen(false); setConfirmEnd(true); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <XCircle size={15} />
                    Encerrar Contrato
                  </button>
                </div>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-slate-100 text-slate-600 border-slate-200">
              Encerrado
            </span>
          )
        }
      />

      {/* Tab Menu */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("aluguel")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold transition-colors ${activeTab === "aluguel"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/40"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
          >
            Aluguel
          </button>
          <button
            onClick={() => setActiveTab("contrato")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold transition-colors ${activeTab === "contrato"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/40"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
          >
            Documentos
            {documents.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {documents.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab: Aluguel */}
        {activeTab === "aluguel" && (
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer */}
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                  Cliente
                </p>
                {customer ? (
                  <Link
                    href={`/cliente/${customer.id}`}
                    className="block font-bold text-blue-600 hover:text-blue-800 transition-colors text-lg"
                  >
                    {customer.name}
                  </Link>
                ) : (
                  <p className="font-bold text-slate-700">—</p>
                )}
                {customer && (
                  <p className="text-sm text-slate-500 font-medium">
                    CPF: {formatCPF(customer.cpf)} &bull; {formatPhone(customer.phone)}
                  </p>
                )}
              </div>

              {/* Vehicle */}
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5">
                  Veículo
                </p>
                {vehicle ? (
                  <Link
                    href={`/veiculo/${vehicle.id}`}
                    className="block font-bold text-blue-600 hover:text-blue-800 transition-colors text-lg"
                  >
                    {vehicle.model?.name || "—"}
                  </Link>
                ) : (
                  <p className="font-bold text-slate-700">—</p>
                )}
                {vehicle && (
                  <p className="text-sm text-slate-500 font-medium">
                    {vehicle.model?.brand} &bull;{" "}
                    <span className="font-bold text-slate-700">{vehicle.plate}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar size={12} /> Início
                </span>
                <span className="font-bold text-slate-700">
                  {formatDate(rental.start_date)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar size={12} /> Término
                </span>
                <span className="font-bold text-slate-700">
                  {rental.end_date ? formatDate(rental.end_date) : "Em andamento"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <Clock size={12} /> Duração
                </span>
                <span className="font-bold text-slate-700">{duration}</span>
              </div>
              {hasFinanceAccess && (
                <div className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <DollarSign size={12} /> Valor Contratual
                  </span>
                  <span className="font-bold text-green-600 text-lg">
                    {(rental.monthly_rate ?? 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Documentos */}
        {activeTab === "contrato" && (() => {
          const docFiles = documents.filter((d) => !isMedia(getFileExt(d.file_url)));
          const mediaFiles = documents.filter((d) => isMedia(getFileExt(d.file_url)));

          return (
            <div className="p-6 space-y-6">
              {/* Upload — apenas contratos ativos */}
              {isActive && (
                <div className="flex items-center justify-end gap-2">
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Upload size={14} />
                    {uploading ? "Enviando..." : "Anexar arquivo"}
                  </button>
                </div>
              )}
              {uploadError && <p className="text-xs text-red-500 font-medium">{uploadError}</p>}

              {docsLoading ? (
                <div className="py-10 text-center text-slate-400 text-sm font-medium">
                  Carregando documentos...
                </div>
              ) : documents.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                  <FileText size={36} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-400 font-bold text-sm">Nenhum arquivo anexado</p>
                  {isActive && (
                    <p className="text-slate-300 text-xs mt-1">Clique em "Anexar arquivo" para adicionar</p>
                  )}
                </div>
              ) : (
                <>
                  {/* Seção: Documentos */}
                  {docFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Documentos</p>
                      <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                        {docFiles.map((doc) => {
                          const name = getFileName(doc.file_url);
                          const ext = getFileExt(doc.file_url);
                          return (
                            <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                              <FileIcon ext={ext} />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-700 text-sm truncate">{name}</p>
                                {doc.created_at && (
                                  <p className="text-xs text-slate-400 font-medium mt-0.5">{formatDate(doc.created_at)}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Abrir arquivo">
                                  <ExternalLink size={15} />
                                </a>
                                {isActive && (
                                  <button onClick={() => handleDelete(doc)} disabled={deleting === doc.id}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40" title="Remover">
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Seção: Mídia */}
                  {mediaFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fotos e vídeos</p>
                      <div className="grid grid-cols-3 gap-2">
                        {mediaFiles.map((doc, idx) => {
                          const ext = getFileExt(doc.file_url);
                          const isVid = isVideo(ext);
                          return (
                            <div key={doc.id} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                              {isVid ? (
                                <video src={doc.file_url} className="w-full h-full object-cover" muted preload="metadata" />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={doc.file_url} alt="" className="w-full h-full object-cover" />
                              )}
                              {/* Overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setLightboxIndex(idx)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white rounded-full p-2 shadow"
                                  title="Visualizar"
                                >
                                  {isVid ? <Play size={14} className="text-slate-700" /> : <ZoomIn size={14} className="text-slate-700" />}
                                </button>
                                {isActive && (
                                  <button
                                    onClick={() => handleDelete(doc)}
                                    disabled={deleting === doc.id}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-red-50 rounded-full p-2 shadow disabled:opacity-40"
                                    title="Remover"
                                  >
                                    <Trash2 size={14} className="text-red-500" />
                                  </button>
                                )}
                              </div>
                              {isVid && (
                                <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 pointer-events-none">
                                  <Play size={9} /> VÍD
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* Lightbox */}
        {lightboxIndex !== null && (() => {
          const mediaFiles = documents.filter((d) => isMedia(getFileExt(d.file_url)));
          const current = mediaFiles[lightboxIndex];
          if (!current) return null;
          const ext = getFileExt(current.file_url);
          const isVid = isVideo(ext);
          const hasPrev = lightboxIndex > 0;
          const hasNext = lightboxIndex < mediaFiles.length - 1;
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
              onClick={() => setLightboxIndex(null)}
            >
              {/* Close */}
              <button
                onClick={() => setLightboxIndex(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
              >
                <X size={20} />
              </button>

              {/* Prev */}
              {hasPrev && (
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                  className="absolute left-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              {/* Media */}
              <div className="max-w-4xl max-h-[85vh] px-16" onClick={(e) => e.stopPropagation()}>
                {isVid ? (
                  <video
                    src={current.file_url}
                    controls
                    autoPlay
                    className="max-h-[85vh] max-w-full rounded-xl"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.file_url}
                    alt=""
                    className="max-h-[85vh] max-w-full rounded-xl object-contain"
                  />
                )}
                {current.created_at && (
                  <p className="text-center text-white/50 text-xs mt-3 font-medium">
                    {formatDate(current.created_at)} &bull; {lightboxIndex + 1}/{mediaFiles.length}
                  </p>
                )}
              </div>

              {/* Next */}
              {hasNext && (
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                  className="absolute right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>
          );
        })()}
      </div>
      {/* Modal edição */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Pencil size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Editar Aluguel</p>
                <p className="text-sm text-slate-500">Atualize as informações do contrato.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {hasFinanceAccess && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Valor Contratual (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editMonthlyRate}
                    onChange={(e) => setEditMonthlyRate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditOpen(false)}
                disabled={saving}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editStartDate}
                className="flex-1 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmação encerramento */}
      {confirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle size={22} className="text-red-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Encerrar Contrato</p>
                <p className="text-sm text-slate-500">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Deseja encerrar o contrato de <span className="font-bold">{customer?.name}</span>? O veículo voltará a ficar disponível.
            </p>

            {/* Imagens de finalização */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Imagens de finalização (opcional)
              </p>
              <button
                type="button"
                onClick={() => finalizationInputRef.current?.click()}
                disabled={ending}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-3 text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 transition-colors disabled:opacity-50"
              >
                <ImagePlus size={16} />
                Adicionar fotos
              </button>
              <input
                ref={finalizationInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFinalizationFileChange}
              />
              {finalizationPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {finalizationPreviews.map((src, i) => (
                    <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFinalizationFile(i)}
                        disabled={ending}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setConfirmEnd(false); setFinalizationFiles([]); setFinalizationPreviews([]); }}
                disabled={ending}
                className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmEnd}
                disabled={ending}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {ending
                  ? finalizationFiles.length > 0
                    ? 'Enviando fotos...'
                    : 'Encerrando...'
                  : 'Encerrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
