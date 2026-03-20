'use client';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { localCustomersApi } from "../../../database/api/local/customers";
import { ArrowLeft, Save } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { maskCPF, maskPhone, rawCPF, rawPhone } from "../../../lib/formatters";

export const ClienteNovoPage: React.FC = () => {
  const router = useRouter();
  const { setCustomers } = useAppContext();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    cpf: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.cpf) return;

    setSubmitting(true);
    setError(null);

    try {
      const newCustomer = await localCustomersApi.create({
        name: form.name,
        phone: rawPhone(form.phone),
        cpf: rawCPF(form.cpf),
      });

      setCustomers((prev) => [newCustomer, ...prev]);
      router.push("/clientes");
    } catch (err) {
      setError("Erro ao cadastrar Cliente. Verifique se o CPF já não está cadastrado.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Novo Cliente"
        subtitle="Cadastre um novo locatário no sistema."
        breadcrumbs={[
          { label: "Clientes", href: "/clientes" },
          { label: "Novo Cliente" }
        ]}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-brand-blue p-4">
          <h3 className="font-bold text-sm text-white">
            Cadastro de Cliente
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 font-medium text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do Cliente"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">
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
              <label className="block text-xs font-bold text-slate-400 mb-2">
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

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => router.push("/clientes")}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-4 bg-[#004AAD] text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Cadastrando..." : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
