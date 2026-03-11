'use client';
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "../../../contexts/AppContext";
import { Document } from "../../../types";
import { localDocumentsApi } from "../../../services/localApi/documents";
import {
  ArrowLeft,
  User,
  Bike,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Trash2,
  Upload,
  ExternalLink,
} from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";

type Tab = "aluguel" | "contrato";

function getFileName(url: string) {
  return url.split(/[\\/]/).pop() || url;
}

function getFileExt(url: string) {
  return (url.split(".").pop() || "").toLowerCase();
}

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
  const { rentalContracts, customers, vehicles } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>("aluguel");

  // Documents state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contract = rentalContracts.find((c) => c.id === id);

  useEffect(() => {
    if (!contract) return;
    setDocsLoading(true);
    localDocumentsApi
      .getByParent(contract.id, "CONTRACT")
      .then(setDocuments)
      .catch(() => setDocuments([]))
      .finally(() => setDocsLoading(false));
  }, [contract?.id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !contract) return;

    // In Electron, file.path gives the absolute local path
    const filePath = (file as { path?: string }).path || file.name;

    const created = await localDocumentsApi.create({
      parent_id: contract.id,
      origin_type: "CONTRACT",
      file_url: filePath,
    });
    setDocuments((prev) => [...prev, created]);
    e.target.value = "";
  };

  const handleDelete = async (docId: string) => {
    setDeleting(docId);
    try {
      await localDocumentsApi.delete(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } finally {
      setDeleting(null);
    }
  };

  if (!contract) {
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

  const customer = customers.find((c) => c.id === contract.customer_id);
  const vehicle = vehicles.find((v) => v.id === contract.vehicle_id);

  const startDate = new Date(contract.start_date);
  const endDate = contract.end_date ? new Date(contract.end_date) : null;
  const now = new Date();
  const diffMs = (endDate ?? now).getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;
  const duration = `${months}m ${days}d`;

  const isActive = contract.status === "ACTIVE";

  return (
    <div className="space-y-6">
      <ModuleHeader 
        title={`Contrato ${id.substring(0, 8)}`} 
        subtitle="Detalhes do aluguel e documentos vinculados." 
        breadcrumbs={[
          { label: "Aluguéis", href: "/alugueis" },
          { label: id.substring(0, 8) }
        ]}
        extraHeader={
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${
              isActive
                ? "bg-green-100 text-green-700 border-green-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
            {isActive ? "Ativo" : "Encerrado"}
          </span>
        }
      />

      {/* Tab Menu */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setActiveTab("aluguel")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-wider transition-colors ${
              activeTab === "aluguel"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/40"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Bike size={16} />
            Aluguel
          </button>
          <button
            onClick={() => setActiveTab("contrato")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-wider transition-colors ${
              activeTab === "contrato"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/40"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FileText size={16} />
            Documentos
            {documents.length > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
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
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User size={12} /> Cliente
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
                    CPF: {customer.cpf} &bull; {customer.phone}
                  </p>
                )}
              </div>

              {/* Vehicle */}
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Bike size={12} /> Veículo
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
                    <span className="font-black text-slate-700">{vehicle.plate}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <Calendar size={12} /> Início
                </span>
                <span className="font-bold text-slate-700">
                  {startDate.toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <Calendar size={12} /> Término
                </span>
                <span className="font-bold text-slate-700">
                  {endDate ? endDate.toLocaleDateString("pt-BR") : "Em andamento"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <Clock size={12} /> Duração
                </span>
                <span className="font-bold text-slate-700">{duration}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <DollarSign size={12} /> Valor mensal
                </span>
                <span className="font-black text-green-600 text-lg">
                  {contract.monthly_rate.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Documentos */}
        {activeTab === "contrato" && (
          <div className="p-6 space-y-4">
            {/* Upload */}
            <div className="flex items-center justify-between">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Arquivos do contrato
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                <Upload size={14} />
                Anexar arquivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* List */}
            {docsLoading ? (
              <div className="py-10 text-center text-slate-400 text-sm font-medium">
                Carregando documentos...
              </div>
            ) : documents.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <FileText size={36} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-400 font-bold text-sm">Nenhum documento anexado</p>
                <p className="text-slate-300 text-xs mt-1">
                  Clique em "Anexar arquivo" para adicionar
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                {documents.map((doc) => {
                  const name = getFileName(doc.file_url);
                  const ext = getFileExt(doc.file_url);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <FileIcon ext={ext} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-700 text-sm truncate">{name}</p>
                        {doc.created_at && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Abrir arquivo"
                        >
                          <ExternalLink size={15} />
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={deleting === doc.id}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
