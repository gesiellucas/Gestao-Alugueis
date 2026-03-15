'use client';
import React, { useState } from "react";
import { useFullSync, useSyncStatus } from "../../../hooks/useSync";
import { RefreshCw, Database, Server, CheckCircle, AlertCircle } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";

export const SyncTab: React.FC = () => {
  const { data: syncStatus, refetch: refetchStatus } = useSyncStatus();
  const syncMutation = useFullSync();
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleManualSync = async () => {
    setSyncMessage(null);
    try {
      const result = await syncMutation.mutateAsync();
      if (result.success) {
        setSyncMessage({ type: 'success', text: 'Sincronização concluída com sucesso!' });
        refetchStatus();
      } else {
        setSyncMessage({ type: 'error', text: result.error || 'Erro desconhecido ao sincronizar.' });
      }
    } catch {
      setSyncMessage({ type: 'error', text: 'Falha na conexão com o servidor Supabase.' });
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Sincronização de Banco de Dados"
        subtitle="Garanta que seus dados estão salvos na nuvem (Supabase)."
        breadcrumbs={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Banco de Dados" }
        ]}
      />

      <div className="">
        <div className="grid grid-cols-1 gap-8 items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
                <Server size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Status da Nuvem
                </p>
                <p className="text-lg font-bold text-slate-700">Offline-First Ativo</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className={`p-3 rounded-xl ${syncStatus?.pendingCount && syncStatus.pendingCount > 0 ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"}`}>
                <RefreshCw size={24} className={syncMutation.isPending ? "animate-spin" : ""} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Alterações Pendentes
                </p>
                <p className="text-lg font-bold text-slate-700">
                  {syncStatus?.pendingCount ?? 0} registros aguardando envio
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium ml-2">
              Última sincronização: <span className="font-bold">{formatDate(syncStatus?.lastSync)}</span>
            </p>

            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-blue-100 h-full">
              <button
                onClick={handleManualSync}
                disabled={syncMutation.isPending}
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
              >
                <RefreshCw size={22} className={syncMutation.isPending ? "animate-spin" : ""} />
                {syncMutation.isPending ? "Sincronizando..." : "Sincronizar Agora"}
              </button>
              <p className="text-sm text-blue-600 text-center mt-4 font-medium">
                Sincroniza automaticamente a cada 5 minutos em segundo plano.
              </p>
              {syncMessage && (
                <div className={`mt-6 p-4 rounded-xl w-full flex items-center gap-3 ${syncMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {syncMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  <span className="text-sm font-bold">{syncMessage.text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
