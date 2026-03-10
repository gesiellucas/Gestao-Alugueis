'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppUser } from "../types";
import {
  LayoutDashboard,
  Bike,
  Wrench,
  Users,
  MessageSquare,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  FileText,
  Settings,
  Minus,
  Maximize2,
} from "lucide-react";
import { SyncIndicator } from "./SyncIndicator";
import { useAutoSync } from "../hooks/useSync";

interface LayoutProps {
  user: AppUser;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const pathname = usePathname();

  // Trigger SQLite background sync with Supabase on mount/login
  useAutoSync(user.id);

  useEffect(() => {
    setIsElectron(!!window.electronAPI?.isElectron);
  }, []);

  const perms = user.role?.permissions || [];
  const hasPerm = (p: string) => perms.includes('*') || perms.includes(p);

  const navItems = [
    {
      to: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: hasPerm('dashboard'),
    },
    {
      to: "/alugueis",
      label: "Aluguéis",
      icon: FileText,
      show: hasPerm('financeiro_view'),
    },
    {
      to: "/veiculos",
      label: "Veículos",
      icon: Bike,
      show: hasPerm('veiculos_view'),
    },
    {
      to: "/clientes",
      label: "Clientes",
      icon: Users,
      show: hasPerm('financeiro_view') || hasPerm('clientes_view'),
    },
    {
      to: "/oficina",
      label: "Oficina",
      icon: Wrench,
      show: hasPerm('oficina_view'),
    },
    {
      to: "/automacao/whatsapp",
      label: "WhatsApp",
      icon: MessageSquare,
      show: hasPerm('financeiro_view'),
    },
    {
      to: "/configuracoes",
      label: "Configurações",
      icon: Settings,
      show: hasPerm('configuracoes'),
    },
  ].filter((item) => item.show);

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* Sidebar - GC Navy Blue */}
      <aside className="hidden md:flex flex-col w-72 bg-[#0a2342] text-white">
        <div className={`p-8 border-b border-white/10${isElectron ? " electron-drag" : ""}`}>
          <div className="flex items-center gap-3 electron-no-drag">
            <div className="bg-yellow-400 p-2 rounded-xl">
              <ShieldCheck className="text-[#0a2342] w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tighter leading-tight">
                GC LOCAMOTO
              </h1>
              <span className="text-[10px] uppercase tracking-widest text-yellow-400 font-bold">
                Portal do Gestor
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-sm font-semibold ${
                isActive(item.to)
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-900/30 ring-1 ring-white/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon
                size={20}
                className={isActive(item.to) ? "text-yellow-400" : ""}
              />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 bg-[#071a33]">
          <div className="mb-4 px-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-black">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user.name}</p>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter">
                {user.role?.name || "USUÁRIO"}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider px-2"
          >
            <LogOut size={18} />
            Desconectar
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Electron frameless: draggable strip with window controls */}
        {isElectron && (
          <div className="hidden md:flex items-center justify-end h-9 bg-[#f1f5f9] flex-shrink-0 electron-drag">
            <div className="flex items-center electron-no-drag">
              <SyncIndicator />
              <button
                onClick={() => window.electronAPI?.windowControls.minimize()}
                className="w-11 h-9 hover:bg-black/5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                title="Minimizar"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={() => window.electronAPI?.windowControls.maximize()}
                className="w-11 h-9 hover:bg-black/5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                title="Maximizar"
              >
                <Maximize2 size={11} />
              </button>
              <button
                onClick={() => window.electronAPI?.windowControls.close()}
                className="w-11 h-9 hover:bg-red-500 hover:text-white flex items-center justify-center text-slate-400 transition-colors"
                title="Fechar"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <header className="md:hidden bg-[#0a2342] text-white p-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-yellow-400 w-6 h-6" />
            <h1 className="text-lg font-extrabold">GC LOCAMOTO</h1>
          </div>
          <div className="flex items-center gap-4">
            <SyncIndicator />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute inset-0 bg-[#0a2342] z-30 pt-20 px-6 pb-6 animate-in slide-in-from-top duration-300">
            <nav className="space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-4 px-5 py-5 rounded-xl text-lg font-bold ${
                    isActive(item.to)
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-white/5 text-slate-300"
                  }`}
                >
                  <item.icon size={24} />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-4 px-5 py-5 rounded-xl text-lg font-bold bg-red-600/20 text-red-500 mt-8 border border-red-600/30"
              >
                <LogOut size={24} />
                Sair do Sistema
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-10">{children}</main>
      </div>
    </div>
  );
};
