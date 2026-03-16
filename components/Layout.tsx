'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ChevronRight,
  Car,
  Palette,
  Database,
} from "lucide-react";
import { SyncIndicator } from "./SyncIndicator";
interface LayoutProps {
  user: AppUser;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const pathname = usePathname();

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
  ].filter((item) => item.show);

  const settingsSubItems = [
    { to: "/configuracoes/acesso", label: "Controle de Acesso", icon: ShieldCheck },
    { to: "/configuracoes/modelos", label: "Modelos de Veículos", icon: Car },
    { to: "/configuracoes/status", label: "Status de Veículos", icon: Palette },
    { to: "/configuracoes/oficinas", label: "Gestão de Oficinas", icon: Wrench },
    { to: "/configuracoes/banco-de-dados", label: "Banco de Dados", icon: Database },
  ];

  const isSettingsOpen = pathname.startsWith('/configuracoes');

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/";
    return pathname.startsWith(to);
  };

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* Sidebar - GC Locamoto Brand Blue */}
      <aside className="hidden md:flex flex-col w-64 bg-[#004AAD] text-white">
        <div className={`p-8 border-b border-white/10${isElectron ? " electron-drag" : ""}`}>
          <div className="electron-no-drag">
            <Image src="/logo.png" alt="GC Locamoto" width={180} height={60} className="w-full h-auto" />
          </div>
        </div>

        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.to}
              href={item.to}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-sm font-semibold ${isActive(item.to)
                ? "bg-white/15 text-white ring-1 ring-white/20 shadow-inner"
                : "text-blue-100 hover:text-white hover:bg-white/10"
                }`}
            >
              <item.icon
                size={20}
                className={isActive(item.to) ? "text-[#0C4AA5]" : ""}
              />
              {item.label}
              {isActive(item.to) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0C4AA5]" />
              )}
            </Link>
          ))}

          {/* Settings submenu */}
          {hasPerm('configuracoes') && (
            <div>
              <Link
                href="/configuracoes/acesso"
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all text-sm font-semibold ${isSettingsOpen
                  ? "bg-white/15 text-white ring-1 ring-white/20"
                  : "text-blue-100 hover:text-white hover:bg-white/10"
                  }`}
              >
                <Settings
                  size={20}
                  className={isSettingsOpen ? "text-[#0C4AA5]" : ""}
                />
                Configurações
                <ChevronRight
                  size={15}
                  className={`ml-auto transition-transform duration-200 ${isSettingsOpen ? "rotate-90 text-[#0C4AA5]" : "text-blue-300"}`}
                />
              </Link>
              {isSettingsOpen && (
                <div className="mt-1 ml-4 space-y-1 border-l border-white/20 pl-3">
                  {settingsSubItems.map((item) => (
                    <Link
                      key={item.to}
                      href={item.to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${pathname === item.to
                        ? "bg-white/15 text-white ring-1 ring-white/20"
                        : "text-blue-100 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      <item.icon
                        size={16}
                        className={pathname === item.to ? "text-[#0C4AA5]" : ""}
                      />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="p-6 border-t border-white/10 bg-[#003d91]">
          <div className="mb-4 px-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0C4AA5] flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-orange-600/30">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user.name}</p>
              <p className="text-[10px] text-orange-300 font-bold uppercase tracking-tighter">
                {user.role?.name || "USUÁRIO"}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 text-blue-200 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider px-2"
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

        <header className="md:hidden bg-[#004AAD] text-white p-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <Bike className="text-[#0C4AA5] w-6 h-6" />
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
          <div className="md:hidden absolute inset-0 bg-[#004AAD] z-30 pt-20 px-6 pb-6 animate-in slide-in-from-top duration-300">
            <nav className="space-y-4 scrollbar-hide">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`w-full flex items-center gap-4 px-5 py-5 rounded-xl text-lg font-bold ${isActive(item.to)
                    ? "bg-white/15 text-white ring-1 ring-white/20 shadow-inner"
                    : "bg-white/5 text-blue-100"
                    }`}
                >
                  <item.icon size={24} className={isActive(item.to) ? "text-[#0C4AA5]" : ""} />
                  {item.label}
                </Link>
              ))}
              {hasPerm('configuracoes') && (
                <div className="space-y-2">
                  <div className={`flex items-center gap-4 px-5 py-3 text-sm font-bold uppercase tracking-widest ${isSettingsOpen ? "text-[#0C4AA5]" : "text-blue-300"}`}>
                    <Settings size={18} />
                    Configurações
                  </div>
                  <div className="ml-4 space-y-2 border-l border-white/20 pl-4">
                    {settingsSubItems.map((item) => (
                      <Link
                        key={item.to}
                        href={item.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold ${pathname === item.to
                          ? "bg-white/15 text-white ring-1 ring-white/20"
                          : "bg-white/5 text-blue-100"
                          }`}
                      >
                        <item.icon size={20} className={pathname === item.to ? "text-[#0C4AA5]" : ""} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-4 px-5 py-5 rounded-xl text-lg font-bold bg-red-600/20 text-red-300 mt-8 border border-red-500/30"
              >
                <LogOut size={24} />
                Sair do Sistema
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
