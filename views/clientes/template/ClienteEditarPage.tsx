'use client';
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { localCustomersApi } from "../../../database/api/local/customers";
import { ArrowLeft, Save } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { maskCPF, maskPhone, rawCPF, rawPhone, formatCPF, formatPhone } from "../../../lib/formatters";

export const ClienteEditarPage: React.FC = () => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { customers, setCustomers } = useAppContext();

  const customer = customers.find((c) => c.id === id);

  const [form, setForm] = useState({
    name: customer?.name || "",
    phone: formatPhone(customer?.phone) === '—' ? '' : formatPhone(customer?.phone),
    cpf: formatCPF(customer?.cpf) === '—' ? '' : formatCPF(customer?.cpf),
    active_contract: customer?.active_contract || false,
    balance_due: customer?.balance_due || 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!customer) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/clientes")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg">
            Cliente não encontrado.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await localCustomersApi.update(id, {
        name: form.name,
        phone: rawPhone(form.phone),
        cpf: rawCPF(form.cpf),
        active_contract: form.active_contract,
        balance_due: form.balance_due,
      });

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
              ...c,
              name: form.name,
              phone: rawPhone(form.phone),
              cpf: rawCPF(form.cpf),
              active_contract: form.active_contract,
              balance_due: form.balance_due,
            }
            : c,
        ),
      );
      router.push(`/cliente/${id}`);
    } catch (err) {
      setError("Erro ao atualizar o cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Editar Cliente"
        subtitle={`Atualizando dados de ${customer.name}.`}
        breadcrumbs={[
          { label: "Clientes", href: "/clientes" },
          { label: customer.name, href: `/cliente/${id}` },
          { label: "Editar" }
        ]}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#004AAD] p-8">
          <h3 className="font-bold text-xl uppercase tracking-tighter text-white">
            {customer.name}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 font-medium text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Telefone (WhatsApp)
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                CPF
              </label>
              <input
                type="text"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                placeholder="000.000.000-00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Débito Pendente (R$)
              </label>
              <input
                type="number"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
                value={form.balance_due}
                onChange={(e) =>
                  setForm({
                    ...form,
                    balance_due: parseFloat(e.target.value) || 0,
                  })
                }
                min={0}
                step={0.01}
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                Contrato Ativo
              </label>
              <button
                type="button"
                onClick={() =>
                  setForm({ ...form, active_contract: !form.active_contract })
                }
                className={`relative w-14 h-7 rounded-full transition-colors ${form.active_contract ? "bg-green-500" : "bg-slate-300"}`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.active_contract ? "translate-x-7" : "translate-x-0.5"}`}
                />
              </button>
              <span
                className={`text-sm font-bold ${form.active_contract ? "text-green-600" : "text-slate-400"}`}
              >
                {form.active_contract ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => router.push(`/cliente/${id}`)}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 bg-[#004AAD] text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} /> {submitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
