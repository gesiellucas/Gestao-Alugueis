'use client';
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { localCustomersApi } from "../../../database/api/local/customers";
import { ArrowLeft, Save } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { maskCPF, maskPhone, rawCPF, rawPhone, formatCPF, formatPhone } from "../../../lib/formatters";

export const ClienteEditarPage: React.FC = () => {
  const params = useParams();
  const id = (typeof window !== 'undefined' && (!params.id || params.id === 'placeholder') ? window.location.pathname.split('/').filter(Boolean).pop() : params.id) as string;
  const router = useRouter();
  const { customers, setCustomers, loading } = useAppContext();

  const customer = customers.find((c) => c.id === id);

  const [form, setForm] = useState({
    name: customer?.name || "",
    phone: formatPhone(customer?.phone) === '—' ? '' : formatPhone(customer?.phone),
    cpf: formatCPF(customer?.cpf) === '—' ? '' : formatCPF(customer?.cpf),
    email: customer?.email || "",
    address: customer?.address || "",
    neighborhood: customer?.neighborhood || "",
    city: customer?.city || "",
    state: customer?.state || "",
    cnh: customer?.cnh || "",
    cnh_category: customer?.cnh_category || "",
    active_contract: customer?.active_contract || false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        phone: formatPhone(customer.phone) === '—' ? '' : formatPhone(customer.phone),
        cpf: formatCPF(customer.cpf) === '—' ? '' : formatCPF(customer.cpf),
        email: customer.email || "",
        address: customer.address || "",
        neighborhood: customer.neighborhood || "",
        city: customer.city || "",
        state: customer.state || "",
        cnh: customer.cnh || "",
        cnh_category: customer.cnh_category || "",
        active_contract: customer.active_contract || false,
      });
    }
  }, [customer?.id]);

  if (loading || !customer) {
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
            {loading ? "Carregando..." : "Cliente não encontrado."}
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
        email: form.email || null,
        address: form.address || null,
        neighborhood: form.neighborhood || null,
        city: form.city || null,
        state: form.state || null,
        cnh: form.cnh || null,
        cnh_category: form.cnh_category || null,
        active_contract: form.active_contract,
      });

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
              ...c,
              name: form.name,
              phone: rawPhone(form.phone),
              cpf: rawCPF(form.cpf),
              email: form.email || null,
              address: form.address || null,
              neighborhood: form.neighborhood || null,
              city: form.city || null,
              state: form.state || null,
              cnh: form.cnh || null,
              cnh_category: form.cnh_category || null,
              active_contract: form.active_contract,
            }
            : c,
        ),
      );
      router.push(`/cliente/${id}`);
    } catch {
      setError("Erro ao atualizar o cliente.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = "w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border";
  const label = "block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2";

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

          {/* Nome */}
          <div>
            <label className={label}>Nome Completo</label>
            <input
              type="text"
              className={field}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Telefone + CPF */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={label}>Telefone (WhatsApp)</label>
              <input
                type="text"
                className={field}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className={label}>CPF</label>
              <input
                type="text"
                className={field}
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: maskCPF(e.target.value) })}
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={label}>E-mail</label>
            <input
              type="email"
              className={field}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="cliente@email.com"
            />
          </div>

          {/* Endereço + Bairro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={label}>Endereço (rua e número)</label>
              <input
                type="text"
                className={field}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Ex: Rua das Flores, 123"
              />
            </div>
            <div>
              <label className={label}>Bairro</label>
              <input
                type="text"
                className={field}
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                placeholder="Ex: Centro"
              />
            </div>
          </div>

          {/* Cidade + Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={label}>Cidade</label>
              <input
                type="text"
                className={field}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Ex: Ribeirão Preto"
              />
            </div>
            <div>
              <label className={label}>Estado (UF)</label>
              <input
                type="text"
                className={field}
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })}
                placeholder="Ex: SP"
                maxLength={2}
              />
            </div>
          </div>

          {/* CNH + Categoria da CNH */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={label}>Número da CNH</label>
              <input
                type="text"
                className={field}
                value={form.cnh}
                onChange={(e) => setForm({ ...form, cnh: e.target.value })}
                placeholder="Ex: 12345678900"
              />
            </div>
            <div>
              <label className={label}>Categoria da CNH</label>
              <select
                className={field}
                value={form.cnh_category}
                onChange={(e) => setForm({ ...form, cnh_category: e.target.value })}
              >
                <option value="">Selecione...</option>
                {['A', 'AB', 'AC', 'AD', 'AE'].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contrato Ativo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div></div>
            {/* Contrato Ativo */}
            <div className="flex items-center gap-4 self-end pb-1">
              <label className={label + " mb-0"}>Contrato Ativo</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, active_contract: !form.active_contract })}
                className={`relative w-14 h-7 rounded-full transition-colors ${form.active_contract ? "bg-green-500" : "bg-slate-300"}`}
              >
                <div
                  className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.active_contract ? "translate-x-7" : "translate-x-0.5"}`}
                />
              </button>
              <span className={`text-sm font-bold ${form.active_contract ? "text-green-600" : "text-slate-400"}`}>
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
