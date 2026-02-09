import React from "react";
import { UserRole, AppUser } from "../types";
import { ShieldCheck, User, Wrench, DollarSign } from "lucide-react";

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const roles = [
    {
      role: UserRole.ADMIN,
      label: "Administrador",
      desc: "Acesso total ao sistema",
      icon: ShieldCheck,
      color: "bg-blue-600",
      user: {
        id: "1",
        name: "Gestor Master",
        role: UserRole.ADMIN,
        email: "admin@gclocamoto.com.br",
      },
    },
    {
      role: UserRole.MECHANIC,
      label: "Oficina / Mecânico",
      desc: "Gestão de frota e reparos",
      icon: Wrench,
      color: "bg-amber-500",
      user: {
        id: "2",
        name: "Roberto Mecânico",
        role: UserRole.MECHANIC,
        email: "oficina@gclocamoto.com.br",
      },
    },
    {
      role: UserRole.BILLING,
      label: "Financeiro / SAC",
      desc: "Cobranças e parceiros",
      icon: DollarSign,
      color: "bg-green-500",
      user: {
        id: "3",
        name: "Clara Financeiro",
        role: UserRole.BILLING,
        email: "financeiro@gclocamoto.com.br",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a2342] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex bg-yellow-400 p-4 rounded-3xl mb-4 shadow-xl shadow-yellow-400/20">
            <ShieldCheck className="text-[#0a2342] w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
            GC LOCA MOTO
          </h1>
          <p className="text-blue-200 font-medium">
            Selecione seu perfil de acesso
          </p>
        </div>

        <div className="space-y-4">
          {roles.map((item) => (
            <button
              key={item.role}
              onClick={() => onLogin(item.user)}
              className="w-full group bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 p-6 rounded-[2rem] text-left transition-all duration-300 flex items-center gap-5 active:scale-95"
            >
              <div
                className={`${item.color} p-4 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform`}
              >
                <item.icon size={24} />
              </div>
              <div>
                <h3 className="text-white font-black text-lg uppercase tracking-tight leading-tight">
                  {item.label}
                </h3>
                <p className="text-blue-300 text-sm">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">
            GC Loca Moto © 2024
          </p>
          <p className="text-blue-500 text-[10px] mt-1 italic">
            Ambiente Seguro de Demonstração MVP
          </p>
        </div>
      </div>
    </div>
  );
};
