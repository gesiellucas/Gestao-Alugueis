'use client';
import React from "react";
import {
  MessageCircle,
  ExternalLink,
  Monitor,
  Cpu,
  HardDrive,
  Shield,
  BarChart3,
  Car,
  Users,
  Wrench,
  FileText,
  Github,
  Heart,
  Zap,
  Globe,
  Code2,
} from "lucide-react";
import pkg from "../../../package.json";
import Image from "next/image";

const modules = [
  { icon: BarChart3, label: "Dashboard", desc: "Visão geral operacional" },
  { icon: Car, label: "Frota", desc: "Gestão de veículos" },
  { icon: Users, label: "Clientes", desc: "Cadastro e histórico" },
  { icon: FileText, label: "Contratos", desc: "Locações ativas" },
  { icon: Wrench, label: "Oficinas", desc: "Manutenção preventiva" },
  { icon: Shield, label: "Acesso", desc: "Permissões e cargos" },
];

const techStack = [
  { label: "Frontend", value: "Next.js 15 + React 19" },
  { label: "Desktop", value: "Electron 34" },
  { label: "Banco de Dados", value: "Supabase (PostgreSQL)" },
  { label: "Linguagem", value: "TypeScript 5.8" },
];

export const AboutTab: React.FC = () => {
  const whatsappLink =
    "https://wa.me/5531986995734?text=Estou%20entrando%20em%20contato%20referente%20ao%20aplicativo%20GC%20Locamotos";
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* ── Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-indigo-500/8 blur-3xl" />

        <div className="relative z-10 flex flex-col items-center px-8 py-14 text-center">
          {/* Logo with glow ring */}
          <div className="relative mb-6">
            <div className="absolute inset-0 scale-125 rounded-full bg-blue-500/20 blur-2xl" />
            <div className="relative rounded-[28px] border-2 border-white/10 bg-white/5 p-1 backdrop-blur-sm shadow-lg shadow-black/30">
              <Image
                src="/icon-app.png"
                alt="GC Locamoto"
                width={96}
                height={96}
                className="rounded-[22px]"
              />
            </div>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            GC Locamoto Pro
          </h2>
          <p className="mt-1.5 text-sm font-medium text-slate-400">
            Sistema de Gestão de Aluguéis de Motocicletas
          </p>

          {/* Version pill */}
          <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2 backdrop-blur">
            <Zap size={14} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              Versão {pkg.version}
            </span>
          </div>
        </div>
      </div>

      {/* ── Modules Grid ── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
          Módulos Inclusos
        </h3>
        <p className="mb-5 text-sm text-slate-500">
          Funcionalidades disponíveis na sua licença.
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {modules.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="group flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
            >
              <div className="shrink-0 rounded-lg bg-blue-100/80 p-2 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech + Contact row ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tech Stack */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Code2 size={16} className="text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Stack Tecnológica
            </h3>
          </div>
          <div className="space-y-3">
            {techStack.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3"
              >
                <span className="text-sm font-medium text-slate-500">{label}</span>
                <span className="rounded-md bg-slate-200/60 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Monitor size={13} />
              <span>Desktop</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Globe size={13} />
              <span>Cloud-ready</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <HardDrive size={13} />
              <span>Offline-first</span>
            </div>
          </div>
        </div>

        {/* Contact & Support */}
        <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">
            Suporte &amp; Contato
          </h3>
          <p className="mb-5 text-sm text-slate-500">
            Dúvidas, problemas ou sugestões? Fale diretamente com o desenvolvedor.
          </p>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-3 rounded-xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/30"
          >
            <MessageCircle
              size={20}
              className="transition-transform group-hover:scale-110"
            />
            Falar pelo WhatsApp
            <ExternalLink size={14} className="opacity-60" />
          </a>

          <div className="mt-auto pt-6">
            <a
              href={pkg.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-slate-700"
            >
              <Github size={14} />
              Repositório no GitHub
              <ExternalLink size={12} className="opacity-50" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-6 py-5 text-center">
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          Feito com <Heart size={12} className="text-rose-400" /> por{" "}
          <span className="font-bold text-slate-600">{pkg.author}</span>
        </p>
        <p className="text-[11px] text-slate-400">
          © {currentYear} GC Locamoto Pro · Licença {pkg.license}
        </p>
      </div>
    </div>
  );
};
