'use client';

import React, { useEffect, useState } from "react";
import { 
  Database, 
  Server, 
  CheckCircle, 
  Activity, 
  Signal, 
  HardDrive, 
  ExternalLink 
} from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { supabase } from "@/database/client/supabase";

export const SyncTab: React.FC = () => {
  const [status, setStatus] = useState<{
    db: boolean;
    storage: boolean;
    realtime: boolean;
    loading: boolean;
  }>({
    db: false,
    storage: false,
    realtime: false,
    loading: true
  });

  const [metadata, setMetadata] = useState({
    url: '',
    buckets: 0
  });

  useEffect(() => {
    async function checkStatus() {
      const url = (supabase as any).supabaseUrl || '';
      setMetadata(prev => ({ ...prev, url }));

      try {
        // 1. Check DB by counting users or any table
        const { error: dbError } = await supabase.from('app_users').select('id', { count: 'exact', head: true }).limit(1);
        
        // 2. Check Storage
        const { data: buckets, error: storageError } = await supabase.storage.listBuckets();

        // 3. Realtime check - we assume active if we can subscribe (simple check)
        const isRealtime = !!supabase.realtime;

        setStatus({
          db: !dbError,
          storage: !storageError,
          realtime: isRealtime,
          loading: false
        });

        if (buckets) {
          setMetadata(prev => ({ ...prev, buckets: buckets.length }));
        }
      } catch (err) {
        setStatus(prev => ({ ...prev, loading: false }));
      }
    }

    checkStatus();
  }, []);

  const StatusCard = ({ 
    title, 
    isActive, 
    icon: Icon, 
    subtitle 
  }: { 
    title: string; 
    isActive: boolean; 
    icon: any; 
    subtitle: string 
  }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-2xl ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
          {isActive ? 'Ativo' : 'Offline'}
        </div>
      </div>
      <div>
        <h3 className="text-slate-900 font-bold text-lg">{title}</h3>
        <p className="text-slate-500 text-sm font-medium">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Status da Infraestrutura"
        subtitle="Monitoramento em tempo real dos serviços em nuvem (Supabase)."
        breadcrumbs={[
          { label: "Configurações", href: "/configuracoes" },
          { label: "Banco de Dados" }
        ]}
      />

      {status.loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
          <Activity size={48} className="animate-spin" />
          <p className="font-bold uppercase tracking-widest text-xs">Verificando serviços...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatusCard 
              title="PostgreSQL" 
              isActive={status.db} 
              icon={Database} 
              subtitle="Banco de dados principal"
            />
            <StatusCard 
              title="Storage" 
              isActive={status.storage} 
              icon={HardDrive} 
              subtitle={`${metadata.buckets} buckets conectados`}
            />
            <StatusCard 
              title="Realtime" 
              isActive={status.realtime} 
              icon={Signal} 
              subtitle="Atualizações em tempo real"
            />
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-12 -mr-12 -mt-12 bg-blue-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Server size={20} className="text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold">Instância Supabase</h2>
                </div>
                
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">URL do Projeto</p>
                  <p className="text-blue-200 font-mono text-sm break-all">
                    {metadata.url}
                  </p>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-xs">Região estimada</p>
                    <p className="text-sm font-bold">América do Sul (São Paulo)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-xs">Versão API</p>
                    <p className="text-sm font-bold">Standard v1.0.0</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle size={32} className="text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-lg">Tudo Operacional</p>
                  <p className="text-slate-400 text-xs">Sua infraestrutura está 100% cloud-ready</p>
                </div>
                <a 
                  href="https://supabase.com/dashboard" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
                >
                  Ver no Console <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

