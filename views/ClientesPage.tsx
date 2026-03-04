'use client';
import React, { useState } from "react";
import Link from "next/link";
import { useAppContext } from "../contexts/AppContext";
import {
  User,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Search,
  PlusCircle,
  Pencil,
} from "lucide-react";

export const ClientesPage: React.FC = () => {
  const { customers, vehicles } = useAppContext();
  const [search, setSearch] = useState("");

  const getCustomerVehicle = (customerId: string) => {
    return vehicles.find((v) => v.current_renter_id === customerId);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf.includes(search) ||
      vehicles.find(
        (v) =>
          v.current_renter_id === c.id &&
          v.plate.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0a2342] uppercase tracking-tight">
            Parceiros GC
          </h2>
          <p className="text-slate-500 font-medium">
            Gestão de entregadores e contratos ativos.
          </p>
        </div>
        <Link
          href="/cliente/novo"
          className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2 uppercase tracking-widest text-xs"
        >
          <PlusCircle size={18} />
          Novo Parceiro
        </Link>
      </div>

      <div className="relative group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
          size={20}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar parceiro por nome, CPF ou placa..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((customer) => {
          const vehicle = getCustomerVehicle(customer.id);
          const hasDebt = customer.balance_due > 0;

          return (
            <div
              key={customer.id}
              className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <Link
                    href={`/cliente/${customer.id}`}
                    className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-2xl border border-blue-100 hover:bg-blue-100 transition-colors"
                  >
                    {customer.name.charAt(0)}
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/cliente/editar/${customer.id}`}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors"
                    >
                      <Pencil size={14} />
                    </Link>
                    {customer.active_contract ? (
                      <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-green-200 flex items-center gap-1">
                        <CheckCircle size={10} /> Ativo
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">
                        Inativo
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/cliente/${customer.id}`}
                  className="block mb-6 group"
                >
                  <h3 className="text-xl font-extrabold text-[#0a2342] mb-1 group-hover:text-blue-600 transition-colors">
                    {customer.name}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <FileText size={14} />
                    <span>CPF: {customer.cpf}</span>
                  </div>
                </Link>

                <div className="space-y-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Veículo Atual
                      </p>
                      <p className="font-bold text-slate-700">
                        {vehicle ? vehicle.model : "Nenhum"}
                      </p>
                    </div>
                    {vehicle && (
                      <p className="text-xs font-black bg-blue-600 text-white px-2 py-1 rounded">
                        {vehicle.plate}
                      </p>
                    )}
                  </div>

                  <div
                    className={`p-4 rounded-xl flex items-center justify-between border ${hasDebt ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}
                  >
                    <div>
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest ${hasDebt ? "text-red-400" : "text-green-400"}`}
                      >
                        {hasDebt ? "Débito Pendente" : "Situação Financeira"}
                      </p>
                      <p
                        className={`font-black text-lg ${hasDebt ? "text-red-600" : "text-green-600"}`}
                      >
                        R$ {customer.balance_due.toFixed(2)}
                      </p>
                    </div>
                    {hasDebt ? (
                      <AlertCircle className="text-red-400" size={24} />
                    ) : (
                      <CheckCircle className="text-green-400" size={24} />
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      window.open(`https://wa.me/${customer.phone}`, "_blank")
                    }
                    className="flex-1 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-green-100"
                  >
                    <MessageSquare size={16} />
                    WhatsApp
                  </button>
                  <Link
                    href={`/cliente/${customer.id}`}
                    className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors flex items-center justify-center"
                  >
                    <User size={18} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
