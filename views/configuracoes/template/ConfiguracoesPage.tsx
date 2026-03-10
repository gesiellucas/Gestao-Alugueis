'use client';
import React, { useState } from "react";
import { useAppContext } from "../../../contexts/AppContext";
import { useFullSync, useSyncStatus } from "../../../hooks/useSync";
import { Settings, RefreshCw, Database, Server, CheckCircle, AlertCircle, ShieldCheck, Car, Palette } from "lucide-react";
import { AccessControl } from "../components/AccessControl";
import { VehicleModelsTab } from "../components/VehicleModelsTab";
import { VehicleStatusesTab } from "../components/VehicleStatusesTab";

export const ConfiguracoesPage: React.FC = () => {
  const { user } = useAppContext();
  const { data: syncStatus, refetch: refetchStatus } = useSyncStatus();
  const syncMutation = useFullSync();
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'access' | 'vehicleModels' | 'vehicleStatuses' | 'sync'>('access');

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
    } catch (err) {
      setSyncMessage({ type: 'error', text: 'Falha na conexão com o servidor Supabase.' });
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleString("pt-BR");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0a2342] tracking-tight uppercase flex items-center gap-3">
            <Settings size={28} className="text-blue-600" />
            Configurações Globais
          </h2>
          <p className="text-slate-500 font-medium">
            Gerencie perfis, acesso e banco de dados.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('access')}
          className={`pb-4 px-2 font-black uppercase tracking-widest text-sm transition-colors border-b-2 ${activeTab === 'access' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2"><ShieldCheck size={18} /> Controle de Acesso</div>
        </button>
        <button
          onClick={() => setActiveTab('vehicleModels')}
          className={`pb-4 px-2 font-black uppercase tracking-widest text-sm transition-colors border-b-2 ${activeTab === 'vehicleModels' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2"><Car size={18} /> Modelos de Veículos</div>
        </button>
        <button
          onClick={() => setActiveTab('vehicleStatuses')}
          className={`pb-4 px-2 font-black uppercase tracking-widest text-sm transition-colors border-b-2 ${activeTab === 'vehicleStatuses' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2"><Palette size={18} /> Status de Veículos</div>
        </button>
        <button
          onClick={() => setActiveTab('sync')}
          className={`pb-4 px-2 font-black uppercase tracking-widest text-sm transition-colors border-b-2 ${activeTab === 'sync' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          <div className="flex items-center gap-2"><Database size={18} /> Banco de Dados</div>
        </button>
      </div>

      {activeTab === 'access' && <AccessControl />}

      {activeTab === 'vehicleModels' && <VehicleModelsTab />}

      {activeTab === 'vehicleStatuses' && <VehicleStatusesTab />}

      {activeTab === 'sync' && (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-[#0a2342] p-8 border-b border-white/10 flex justify-between items-center">
            <div>
              <h3 className="font-black text-xl uppercase tracking-tighter text-white flex items-center gap-2">
                <Database size={20} className="text-yellow-400" />
                Sincronização de Banco de Dados
              </h3>
              <p className="text-blue-200 text-sm mt-1">
                Garanta que seus dados estão salvos na nuvem (Supabase).
              </p>
            </div>
          </div>

          <div className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

              {/* Status Panel */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
                    <Server size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Status da Nuvem
                    </p>
                    <p className="text-lg font-bold text-slate-700">
                      Offline-First Ativo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className={`p-3 rounded-xl ${syncStatus?.pendingCount && syncStatus.pendingCount > 0 ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"}`}>
                    <RefreshCw size={24} className={syncMutation.isPending ? "animate-spin" : ""} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
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
              </div>

              {/* Action Panel */}
              <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-3xl border border-blue-100 h-full">
                <button
                  onClick={handleManualSync}
                  disabled={syncMutation.isPending}
                  className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
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
      )}
    </div>
  );
};
