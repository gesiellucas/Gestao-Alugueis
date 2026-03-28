'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isElectron } from '../../lib/ipc';

export default function SetupPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [publishableKey, setPublishableKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If not in Electron, this page has no purpose — redirect home
    if (!isElectron()) {
      router.replace('/');
      return;
    }

    // Check if variables are already present in localStorage or env
    if (localStorage.getItem('supabase_url') || process.env.NEXT_PUBLIC_SUPABASE_URL) {
      router.replace('/');
    }
  }, [router]);

  const handleSave = async () => {
    if (!url || !anonKey || !publishableKey) {
      setError('Preencha todos os campos.');
      return;
    }

    setTesting(true);
    setError(null);

    try {
      // Quick connectivity test before saving
      const testRes = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: anonKey },
      });

      if (!testRes.ok) {
        throw new Error(`Falha na conexão (${testRes.status}). Verifique a URL e as chaves.`);
      }

      localStorage.setItem('supabase_url', url);
      localStorage.setItem('supabase_anon_key', anonKey);
      localStorage.setItem('supabase_publishable_key', publishableKey);

      setSyncing(true);
      // Wait a moment for "sync" effect
      await new Promise(res => setTimeout(res, 1000));

      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao conectar.');
    } finally {
      setTesting(false);
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl p-10 max-w-lg w-full space-y-6 shadow-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuração Inicial</h1>
          <p className="text-slate-500 text-sm mt-1">
            Insira as credenciais do Supabase para habilitar a conexão de dados.
          </p>
        </div>

        {/* Supabase URL */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">URL do Projeto</label>
          <input
            type="url"
            placeholder="https://xxxx.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value.trim())}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Anon Key */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">Anon Key</label>
          <input
            type="password"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={anonKey}
            onChange={(e) => setAnonKey(e.target.value.trim())}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Publishable Key */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">Publishable Key</label>
          <input
            type="password"
            placeholder="sb_publishable_..."
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value.trim())}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={testing || syncing || !url || !anonKey || !publishableKey}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm
                     disabled:opacity-40 disabled:cursor-not-allowed
                     hover:bg-slate-800 transition-colors"
        >
          {syncing ? 'Verificando conexão...' : testing ? 'Testando conexão...' : 'Salvar e Conectar'}
        </button>

        <p className="text-center text-xs text-slate-400">
          As credenciais são armazenadas localmente nesta máquina.
        </p>
      </div>
    </div>
  );
}

