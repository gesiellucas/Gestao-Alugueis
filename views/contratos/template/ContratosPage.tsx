'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileSignature, PlusCircle, Search, Eye, Clock,
  CheckCircle2, XCircle, FileText, Loader2,
} from 'lucide-react';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Contract, ContratoStatus } from '../../../types';

const STATUS_CONFIG: Record<ContratoStatus, { label: string; className: string; icon: React.ReactNode }> = {
  rascunho: {
    label: 'Rascunho',
    className: 'bg-slate-100 text-slate-600',
    icon: <FileText size={12} />,
  },
  ativo: {
    label: 'Ativo',
    className: 'bg-green-100 text-green-700',
    icon: <CheckCircle2 size={12} />,
  },
  encerrado: {
    label: 'Encerrado',
    className: 'bg-blue-100 text-blue-700',
    icon: <Clock size={12} />,
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-700',
    icon: <XCircle size={12} />,
  },
};

interface ContratosPageProps {
  contratos: Contract[];
  loading?: boolean;
}

export const ContratosPage: React.FC<ContratosPageProps> = ({ contratos, loading }) => {
  const [search, setSearch] = useState('');

  const filtered = contratos.filter((c) =>
    c.template_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.form_data?.nome_cliente ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Contratos"
        subtitle="Geração e gerenciamento de contratos a partir de templates."
        breadcrumbs={[{ label: 'Contratos' }]}
        extraHeader={
          <Link
            href="/contratos/novo"
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
          >
            <PlusCircle size={16} />
            Novo Contrato
          </Link>
        }
      />

      <div className="relative group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
          size={20}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por template ou nome do cliente..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all font-medium text-slate-700"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-blue-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
            <FileSignature size={40} className="text-slate-200" />
            <p className="font-medium text-sm">
              {contratos.length === 0
                ? 'Nenhum contrato gerado ainda. Clique em "Novo Contrato" para começar.'
                : 'Nenhum contrato encontrado para essa busca.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#004AAD] text-white">
                <tr className="[&>th]:px-6 [&>th]:py-4 [&>th]:text-left [&>th]:text-xs [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-widest">
                  <th>Template</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((contrato) => {
                  const status = STATUS_CONFIG[contrato.status];
                  return (
                    <tr key={contrato.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                            <FileSignature size={16} />
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">{contrato.template_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {contrato.form_data?.nome_cliente ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {new Date(contrato.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/contratos/${contrato.id}`}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-xs transition-colors"
                        >
                          <Eye size={14} />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
