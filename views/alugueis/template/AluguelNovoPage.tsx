'use client';
import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { VEHICLE_STATUS_IDS } from "../../../types";
import {
  Save,
  Search,
  User,
  Bike,
  DollarSign,
  Calendar,
} from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { formatCPF, formatPhone } from "../../../lib/formatters";

export const AluguelNovoPage: React.FC = () => {
  const params = useParams();
  const preselectedVehicleId = params.vehicleId ? (params.vehicleId as string) : undefined;
  const router = useRouter();
  const { vehicles, customers, handleCreateRental, loading } = useAppContext();

  console.log(customers);
  const availableVehicles = vehicles.filter(
    (v) => v.status_id === VEHICLE_STATUS_IDS.AVAILABLE,
  );

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(preselectedVehicleId ?? null);
  const vehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [monthlyRate, setMonthlyRate] = useState(
    vehicle?.default_monthly_rate?.toString() || "",
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Update monthly rate when vehicle selection changes
  useEffect(() => {
    if (vehicle?.default_monthly_rate) {
      setMonthlyRate(vehicle.default_monthly_rate.toString());
    }
  }, [vehicle]);

  const availableCustomers = useMemo(() => {
    if (loading) return [];
    return customers.filter((c) => {
      const name = (c.name || "").toLowerCase();
      const cpf = (c.cpf || "");
      const search = customerSearch.toLowerCase();

      const matchesSearch =
        !customerSearch ||
        name.includes(search) ||
        cpf.includes(search);
      return matchesSearch;
    });
  }, [customers, customerSearch, loading]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !selectedCustomerId || !monthlyRate || !startDate) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const contract = await handleCreateRental(
        vehicle.id,
        selectedCustomerId,
        parseFloat(monthlyRate),
        startDate,
      );
      router.push(`/alugueis/${contract.id}`);
    } catch {
      setErrorMsg("Erro ao criar contrato. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Novo Aluguel"
        subtitle={vehicle ? `Iniciando contrato para o veículo ${vehicle.plate}.` : "Preencha os dados para criar um novo contrato."}
        breadcrumbs={[
          { label: "Aluguéis", href: "/alugueis" },
          { label: "Novo Aluguel" }
        ]}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-brand-blue p-4">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="font-bold tracking-tighter text-white">
                {vehicle ? (vehicle.model?.name || 'Modelo desconhecido') : 'Selecione o veículo e o condutor'}
              </h3>
              {vehicle && (
                <p className="text-blue-300 text-sm font-mono font-bold">
                  {vehicle.plate}
                </p>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {!preselectedVehicleId && (
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-3">
                Selecionar Veículo
              </label>
              {vehicle ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-blue-900 text-lg">
                      {vehicle.model?.brand} {vehicle.model?.name}
                    </p>
                    <p className="text-sm text-blue-600 font-mono font-bold">{vehicle.plate}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedVehicleId(null)}
                    className="text-blue-500 hover:text-blue-700 font-bold text-sm uppercase"
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                  {availableVehicles.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 font-medium">
                      Nenhum veículo disponível.
                    </div>
                  ) : (
                    availableVehicles.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVehicleId(v.id)}
                        className="w-full flex flex-row gap-4 text-left p-4 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <p className="font-bold text-brand-blue">{v.plate}</p>
                        <p className="text-slate-500 font-mono font-medium">
                          {v.model?.brand} / {v.model?.name}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 font-medium text-sm">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-400 mb-3">
              Selecionar Cliente
            </label>

            {selectedCustomer ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-blue-900 text-lg">
                    {selectedCustomer.name}
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    CPF: {formatCPF(selectedCustomer.cpf)} &bull; {formatPhone(selectedCustomer.phone)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(null)}
                  className="text-blue-500 hover:text-blue-700 font-bold text-sm uppercase"
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
                    className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 pl-12 font-medium text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
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
                        className="w-full flex flex-row gap-4 items-center text-left p-4 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <p className="font-bold text-[#004AAD]">
                          {customer.name}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          CPF: {formatCPF(customer.cpf)} &bull; {formatPhone(customer.phone)}
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
              <label className="block text-sm font-bold text-slate-400 mb-2">
                Valor Contratual (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
                value={monthlyRate}
                onChange={(e) => setMonthlyRate(e.target.value)}
                placeholder="800.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all border"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => router.push(vehicle ? `/veiculo/${vehicle.id}` : "/alugueis")}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!vehicle || !selectedCustomerId || !monthlyRate || submitting}
              className="flex-1 py-4 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Registrando..." : "Registrar Aluguel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
