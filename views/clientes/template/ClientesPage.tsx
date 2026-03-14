'use client';
import React, { useState } from "react";
import Link from "next/link";
import { useAppContext } from "../../../contexts/AppContext";
import {
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Search,
  PlusCircle,
  Pencil,
  User,
} from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";

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
      <ModuleHeader
        title="Clientes"
        subtitle="Gerenciamento de clientes."
        breadcrumbs={[{ label: "Clientes" }]}
        extraHeader={
          <Link
            href="/cliente/novo"
            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
          >
            Novo Cliente
          </Link>
        } />

      <div className="relative group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
          size={20}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar Cliente por nome, CPF ou placa..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all font-medium text-slate-700"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-medium text-sm">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">CPF</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Veículo</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Situação</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Débito</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => {
                  const vehicle = getCustomerVehicle(customer.id);
                  const hasDebt = customer.balance_due > 0;

                  return (
                    <tr key={customer.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/cliente/${customer.id}`} className="flex items-center gap-3 group">
                          <span className="font-bold text-[#004AAD] group-hover:text-blue-600 transition-colors">
                            {customer.name}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{customer.cpf}</td>
                      <td className="px-6 py-4">
                        {vehicle ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded">
                              {vehicle.plate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {customer.active_contract ? (
                          <span className="bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-green-200 inline-flex items-center gap-1">
                            Ativo
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-slate-200">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 font-black text-sm ${hasDebt ? "text-red-600" : "text-green-600"}`}>
                          {(customer.balance_due ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => window.open(`https://wa.me/${customer.phone}`, "_blank")}
                            className="p-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <Link
                            href={`/cliente/editar/${customer.id}`}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </Link>
                          <Link
                            href={`/cliente/${customer.id}`}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
                            title="Ver perfil"
                          >
                            <User size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
