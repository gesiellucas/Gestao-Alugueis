'use client';
import React from "react";
import { Info, MessageCircle, ExternalLink } from "lucide-react";
import pkg from "../../../package.json";
import Image from "next/image";

export const AboutTab: React.FC = () => {
  const whatsappLink =
    "https://wa.me/5531986995734?text=Estou%20entrando%20em%20contato%20referente%20ao%20aplicativo%20GC%20Locamotos";

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* App Icon */}
            <Image src="/icon-app.png" alt="GC Locamoto" width={128} height={128} className="" />


            {/* App Name */}
            <div className="space-y-2">
              <h2 className="text-3xl font-medium text-slate-800 tracking-tight">
                GC Locamoto Pro
              </h2>
              <p className="text-sm text-slate-500 font-medium">
                Gestão de aluguéis de motos
              </p>
            </div>

            {/* Version */}
            <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Versão
              </p>
              <p className="text-lg font-bold text-slate-700">
                {pkg.version}
              </p>
            </div>

            {/* Contact */}
            <div className="w-full max-w-sm space-y-4">
              <p className="text-sm text-slate-500 font-medium">
                Precisa de ajuda ou quer reportar um problema?
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 bg-green-600 text-white rounded-xl font-medium shadow-xl shadow-green-600/20 hover:bg-green-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 text-base"
              >
                <MessageCircle size={22} />
                Falar com o Desenvolvedor
                <ExternalLink size={16} />
              </a>
              <p className="text-xs text-slate-400">
                Você será redirecionado para o WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
