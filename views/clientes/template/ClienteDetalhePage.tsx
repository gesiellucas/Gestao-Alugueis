'use client';
import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "../../../contexts/AppContext";
import {
  ArrowLeft,
  Pencil,
  Phone,
  FileText,
  CheckCircle,
  MessageSquare,
  Bike,
} from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useFinanceAccess } from "../../../hooks/useFinanceAccess";
import { formatCPF, formatPhone, formatDate, toWhatsApp } from "../../../lib/formatters";

export const ClienteDetalhePage: React.FC = () => {
  const params = useParams();
  const id = (typeof window !== 'undefined' && (!params.id || params.id === 'placeholder') ? window.location.pathname.split('/').filter(Boolean).pop() : params.id) as string;
  const router = useRouter();
  const { customers, vehicles, rentalContracts } = useAppContext();

  const hasFinanceAccess = useFinanceAccess();
  const customer = customers.find((c) => c.id === id);
  const vehicle = vehicles.find((v) => v.current_renter_id === id);
  const customerRentals = rentalContracts
    .filter((c) => c.customer_id === id)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));

  if (!customer) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/clientes")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar para Clientes
        </button>
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg">
            Cliente não encontrado.
          </p>
        </div>
      </div>
    );
  }

  const hasDebt = customer.balance_due > 0;

  return (
    <div className="space-y-8">
      <ModuleHeader
        title={customer.name}
        subtitle={`Informações detalhadas do cliente ${formatCPF(customer.cpf)}.`}
        breadcrumbs={[
          { label: "Clientes", href: "/clientes" },
          { label: customer.name }
        ]}
        extraHeader={
          <Link
            href={`/cliente/editar/${customer.id}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 text-sm"
          >
            <Pencil size={16} /> Editar Cliente
          </Link>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10">
          <div className="flex items-start gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-extrabold text-[#004AAD]">
                  {customer.name}
                </h2>
                {customer.active_contract ? (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-green-200 flex items-center gap-1">
                    <CheckCircle size={12} /> Ativo
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">
                    Inativo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                <span className="flex items-center gap-1">
                  <FileText size={14} /> CPF: {formatCPF(customer.cpf)}
                </span>
                <span className="flex items-center gap-1">
                  <Phone size={14} /> {formatPhone(customer.phone)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Bike size={12} /> Veículo Vinculado
              </p>
              {vehicle ? (
                <Link
                  href={`/veiculo/${vehicle.id}`}
                  className="block hover:bg-slate-100 -m-2 p-2 rounded-xl transition-colors"
                >
                  <p className="font-extrabold text-[#004AAD] text-lg">
                    {vehicle.model?.name || 'Modelo desconhecido'}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded">
                      {vehicle.plate}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">
                      {vehicle.mileage.toLocaleString()} km
                    </span>
                  </div>
                </Link>
              ) : (
                <p className="text-slate-500 font-medium text-lg">
                  Nenhum veículo vinculado
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() =>
                window.open(`https://wa.me/${toWhatsApp(customer.phone)}`, "_blank")
              }
              className="flex-1 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-green-100"
            >
              <MessageSquare size={18} /> Enviar WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Histórico de Aluguéis */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex items-center bg-brand-blue gap-3 px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-white text-sm">
            Histórico de Aluguéis
          </h3>
          <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
            {customerRentals.length}
          </span>
        </div>
        {customerRentals.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-medium text-sm">
            Nenhum aluguel registrado para este cliente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Veículo</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Início</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Término</th>
                  {hasFinanceAccess && <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Valor/mês</th>}
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">Situação</th>
                </tr>
              </thead>
              <tbody>
                {customerRentals.map((contract) => {
                  const contractVehicle = vehicles.find((v) => v.id === contract.vehicle_id);
                  return (
                    <tr key={contract.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        {contractVehicle ? (
                          <Link
                            href={`/veiculo/${contractVehicle.id}`}
                            className="font-bold text-[#004AAD] hover:text-blue-600 transition-colors"
                          >
                            {contractVehicle.model?.name ?? '—'}
                            {contractVehicle.plate && (
                              <span className="ml-2 text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                                {contractVehicle.plate}
                              </span>
                            )}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {formatDate(contract.start_date)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {contract.end_date ? formatDate(contract.end_date) : "—"}
                      </td>
                      {hasFinanceAccess && (
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {contract.monthly_rate.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        {contract.status === "ACTIVE" ? (
                          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-green-200 inline-flex items-center gap-1">
                            <CheckCircle size={10} /> Ativo
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                            Encerrado
                          </span>
                        )}
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
