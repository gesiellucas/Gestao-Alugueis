'use client';
import React, { useState } from "react";
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
  ChevronDown,
  Trash2,
  Mail,
  MapPin,
  CreditCard,
} from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { useFinanceAccess } from "../../../hooks/useFinanceAccess";
import { formatCPF, formatPhone, formatDate, toWhatsApp } from "../../../lib/formatters";

export const ClienteDetalhePage: React.FC = () => {
  const params = useParams();
  const id = (typeof window !== 'undefined' && (!params.id || params.id === 'placeholder') ? window.location.pathname.split('/').filter(Boolean).pop() : params.id) as string;
  const router = useRouter();
  const { customers, vehicles, rentalContracts, loading, handleDeleteCustomer } = useAppContext();

  const [actionsOpen, setActionsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const hasFinanceAccess = useFinanceAccess();
  const customer = customers.find((c) => c.id === id);
  const vehicle = vehicles.find((v) => v.current_renter_id === id);
  const customerRentals = rentalContracts
    .filter((c) => c.customer_id === id)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));

  if (loading || !customer) {
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
            {loading ? "Carregando..." : "Cliente não encontrado."}
          </p>
        </div>
      </div>
    );
  }

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
          <div className="relative">
            <button
              onClick={() => setActionsOpen((v) => !v)}
              className="bg-[#004AAD] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#003a8c] transition-all flex items-center gap-2 text-sm"
            >
              Ações <ChevronDown size={16} className={`transition-transform ${actionsOpen ? 'rotate-180' : ''}`} />
            </button>
            {actionsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActionsOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-1 overflow-hidden">
                  <Link
                    href={`/cliente/editar/${customer.id}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                    onClick={() => setActionsOpen(false)}
                  >
                    <Pencil size={16} /> Editar Cliente
                  </Link>
                  {!customer.active_contract && (
                    <>
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={() => { setActionsOpen(false); setShowDeleteConfirm(true); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} /> Excluir Cliente
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        }
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-extrabold text-red-600">Excluir Cliente</h3>
            <p className="text-slate-600">
              Tem certeza que deseja excluir o cliente{" "}
              <span className="font-bold">{customer.name}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await handleDeleteCustomer(customer.id);
                    router.push('/clientes');
                  } finally {
                    setDeleting(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={deleting}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-sm font-medium mt-1">
                {customer.cpf && (
                  <span className="flex items-center gap-1">
                    <FileText size={14} /> CPF: {formatCPF(customer.cpf)}
                  </span>
                )}
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={14} /> {formatPhone(customer.phone)}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={14} /> {customer.email}
                  </span>
                )}
              </div>
              {(customer.address || customer.neighborhood || customer.city) && (
                <div className="flex items-start gap-1 text-slate-400 text-sm font-medium mt-1">
                  <MapPin size={14} className="mt-0.5 shrink-0" />
                  <span>
                    {[
                      customer.address,
                      customer.neighborhood,
                      customer.city && customer.state
                        ? `${customer.city}-${customer.state}`
                        : (customer.city || customer.state),
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {(customer.cnh || customer.cnh_category) && (
                <div className="flex items-center gap-1 text-slate-400 text-sm font-medium mt-1">
                  <CreditCard size={14} />
                  <span>
                    CNH: {[customer.cnh, customer.cnh_category ? `Cat. ${customer.cnh_category}` : null].filter(Boolean).join(' — ')}
                  </span>
                </div>
              )}
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
                    <tr
                      key={contract.id}
                      onClick={() => router.push(`/alugueis/${contract.id}`)}
                      className="border-b border-slate-50 hover:bg-blue-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        {contractVehicle ? (
                          <span className="font-bold text-[#004AAD]">
                            {contractVehicle.model?.name ?? '—'}
                            {contractVehicle.plate && (
                              <span className="ml-2 text-xs font-bold bg-blue-600 text-white px-2 py-0.5 rounded">
                                {contractVehicle.plate}
                              </span>
                            )}
                          </span>
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
