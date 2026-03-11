'use client';
import React, { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { VEHICLE_STATUS_IDS } from "../../../types";
import {
  ArrowLeft,
  Save,
  Search,
  User,
  Bike,
  DollarSign,
  Calendar,
} from "lucide-react";

export const AluguelNovoPage: React.FC = () => {
  const params = useParams();
  const vehicleId = params.vehicleId as string;
  const router = useRouter();
  const { vehicles, customers, handleCreateRental } = useAppContext();

  const vehicle = vehicles.find((v) => v.id === vehicleId);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [monthlyRate, setMonthlyRate] = useState(
    vehicle?.default_monthly_rate?.toString() || "",
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availableCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        !customerSearch ||
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.cpf.includes(customerSearch);
      return matchesSearch;
    });
  }, [customers, customerSearch]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push("/veiculos")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar para Frota
        </button>
        <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg">
            Veículo não encontrado.
          </p>
        </div>
      </div>
    );
  }

  if (vehicle.status_id !== VEHICLE_STATUS_IDS.AVAILABLE) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push(`/veiculo/${vehicle.id}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg">
            Este veículo não está disponível para aluguel.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !monthlyRate || !startDate) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await handleCreateRental(
        vehicle.id,
        selectedCustomerId,
        parseFloat(monthlyRate),
        startDate,
      );
      router.push(`/veiculo/${vehicle.id}`);
    } catch {
      setErrorMsg("Erro ao criar contrato. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/veiculo/${vehicle.id}`)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar
        </button>
        <h2 className="text-3xl font-extrabold text-[#1a4fd6] uppercase tracking-tight">
          Novo Aluguel
        </h2>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-[#1a4fd6] p-8">
          <div className="flex items-center gap-4">
            <Bike size={24} className="text-blue-400" />
            <div>
              <h3 className="font-black text-xl uppercase tracking-tighter text-white">
                {vehicle.model?.name || 'Modelo desconhecido'}
              </h3>
              <p className="text-blue-300 text-sm font-mono font-bold">
                {vehicle.plate}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 font-medium text-sm">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              <User size={12} className="inline mr-1" />
              Selecionar Cliente
            </label>

            {selectedCustomer ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-blue-900 text-lg">
                    {selectedCustomer.name}
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    CPF: {selectedCustomer.cpf} &bull; {selectedCustomer.phone}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId("")}
                  className="text-blue-500 hover:text-blue-700 font-black text-sm uppercase"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 pl-12 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 focus:border-blue-500 transition-all border"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Buscar por nome ou CPF..."
                  />
                </div>

                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                  {availableCustomers.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 font-medium">
                      Nenhum Cliente encontrado.
                    </div>
                  ) : (
                    availableCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(customer.id);
                          setCustomerSearch("");
                        }}
                        className="w-full text-left p-4 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <p className="font-bold text-[#1a4fd6]">
                          {customer.name}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          CPF: {customer.cpf} &bull; {customer.phone}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                <DollarSign size={12} className="inline mr-1" />
                Valor Mensal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 focus:border-blue-500 transition-all border"
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(e.target.value)}
                placeholder="800.00"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                <Calendar size={12} className="inline mr-1" />
                Data de Início
              </label>
              <input
                type="date"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 focus:border-blue-500 transition-all border"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => router.push(`/veiculo/${vehicle.id}`)}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedCustomerId || !monthlyRate || submitting}
              className="flex-1 py-4 bg-[#1a4fd6] text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {submitting ? "Registrando..." : "Registrar Aluguel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
