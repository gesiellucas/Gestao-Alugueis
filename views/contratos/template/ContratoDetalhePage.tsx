'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileSignature, Download, Printer, Trash2, CheckCircle2,
  Clock, XCircle, FileText, Loader2, AlertCircle,
} from 'lucide-react';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Contract, ContratoStatus, Document } from '../../../types';
import { supabaseContractsApi } from '../../../database/api/supabase/contracts';
import { supabaseContractDocumentsApi } from '../../../database/api/supabase/contractDocuments';
import { fetchTemplateBuffer, fillDocxTemplate, downloadDocx, buildDateFields } from '../../../lib/docxTemplate';
import { CONTRATOS_TEMPLATES } from '../templates';

const STATUS_CONFIG: Record<ContratoStatus, { label: string; className: string; icon: React.ReactNode }> = {
  rascunho: { label: 'Rascunho', className: 'bg-slate-100 text-slate-600', icon: <FileText size={13} /> },
  ativo: { label: 'Ativo', className: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={13} /> },
  encerrado: { label: 'Encerrado', className: 'bg-blue-100 text-blue-700', icon: <Clock size={13} /> },
  cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-700', icon: <XCircle size={13} /> },
};

interface ContratoDetalhePageProps {
  contractId: string;
}

export const ContratoDetalhePage: React.FC<ContratoDetalhePageProps> = ({ contractId }) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [c, docs] = await Promise.all([
          supabaseContractsApi.getById(contractId),
          supabaseContractDocumentsApi.getByContract(contractId),
        ]);
        setContract(c);
        setDocuments(docs);
      } catch (e) {
        console.error(e);
        setError('Erro ao carregar contrato.');
      } finally {
        setLoading(false);
      }
    })();
  }, [contractId]);

  const handleDownloadDocx = async () => {
    if (!contract) return;
    setRegenerating(true);
    try {
      const template = CONTRATOS_TEMPLATES.find((t) => t.id === contract.template_id);
      if (!template) throw new Error('Template não encontrado');
      const buffer = await fetchTemplateBuffer(template.templateFile);
      const data = { ...buildDateFields(new Date(contract.created_at)), ...contract.form_data };
      const blob = fillDocxTemplate(buffer, data);
      const filename = `${contract.template_name} - ${contract.form_data['nome_cliente'] ?? contract.id}.docx`;
      downloadDocx(blob, filename);
    } catch (e) {
      console.error(e);
      setError('Erro ao baixar DOCX.');
    } finally {
      setRegenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!contract) return;
    setRegenerating(true);
    try {
      const template = CONTRATOS_TEMPLATES.find((t) => t.id === contract.template_id);
      if (!template) throw new Error('Template não encontrado');
      const buffer = await fetchTemplateBuffer(template.templateFile);
      const data = { ...buildDateFields(new Date(contract.created_at)), ...contract.form_data };
      const blob = fillDocxTemplate(buffer, data);

      // Abre em nova aba para impressão / salvar como PDF
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      console.error(e);
      setError('Erro ao preparar impressão.');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-8">
        <ModuleHeader title="Contrato" breadcrumbs={[{ label: 'Contratos', href: '/contratos' }, { label: 'Detalhe' }]} />
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center text-slate-400">
          Contrato não encontrado.
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[contract.status];
  const createdAt = new Date(contract.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Detalhe do Contrato"
        breadcrumbs={[{ label: 'Contratos', href: '/contratos' }, { label: contract.template_name }]}
        extraHeader={
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={regenerating}
              title="Abrir para impressão / salvar como PDF"
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              {regenerating ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
              PDF
            </button>
            <button
              onClick={handleDownloadDocx}
              disabled={regenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {regenerating ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              Baixar DOCX
            </button>
          </div>
        }
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info principal */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileSignature size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">{contract.template_name}</p>
                <p className="text-slate-400 text-xs mt-0.5">Gerado em {createdAt}</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${status.className}`}>
              {status.icon}
              {status.label}
            </span>
          </div>

          <div className="border-t border-slate-50 pt-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dados do Contrato</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(contract.form_data).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: documentos e ações */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Arquivos no Storage</p>
            {documents.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum arquivo armazenado.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    >
                      <Download size={14} />
                      <span className="truncate">Contrato salvo</span>
                    </a>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/contratos"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors px-2"
          >
            <ArrowLeft size={15} />
            Voltar para Contratos
          </Link>
        </div>
      </div>
    </div>
  );
};
