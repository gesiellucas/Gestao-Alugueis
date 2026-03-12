'use client';
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { Search, Calendar, User, Bike, DollarSign, CheckCircle, XCircle, Plus } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";

export const AlugueisPage: React.FC = () => {
  const { rentalContracts, customers, vehicles } = useAppContext();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");

  const enrichedContracts = useMemo(() => {
    return rentalContracts.map((contract) => {
      const customer = customers.find((c) => c.id === contract.customer_id);
      const vehicle = vehicles.find((v) => v.id === contract.vehicle_id);
      return {
        ...contract,
        customerName: customer?.name || "Cliente não encontrado",
        customerCPF: customer?.cpf || "-",
        vehicleModel: vehicle?.model?.name || "Veículo não encontrado",
        vehicle_plate: vehicle?.plate || "-",
        vehicleBrand: vehicle?.model?.brand || "-",
      };
    });
  }, [rentalContracts, customers, vehicles]);

  const filteredContracts = useMemo(() => {
    return enrichedContracts.filter((contract) => {
      const matchesSearch =
        contract.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.vehicle_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.customerCPF.includes(searchTerm);

      const matchesStatus =
        statusFilter === "TODOS" || contract.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [enrichedContracts, searchTerm, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const calculateDuration = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    return `${months}m ${days}d`;
  };

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Histórico de Aluguéis"
        subtitle="Relação completa de clientes, veículos e contratos."
        breadcrumbs={[{ label: "Aluguéis" }]}
        extraHeader={
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/alugueis/novo")}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#004AAD] text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
            >
              Novo Aluguel
            </button>
          </div>
        } />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por cliente, placa, modelo ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004AAD] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-2">
            {["TODOS", "ACTIVE", "ENDED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${statusFilter === status
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
              >
                {status === "TODOS" ? "Todos" : status === "ACTIVE" ? "Ativos" : "Encerrados"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#004AAD] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">CPF</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Placa</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Início</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Duração</th>
                <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest">Valor Mensal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-slate-400 font-bold text-lg">Nenhum contrato encontrado</p>
                    <p className="text-slate-300 text-sm mt-1">Tente ajustar os filtros acima.</p>
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/alugueis/${contract.id}`)}
                  >
                    <td className="px-6 py-4">
                      {contract.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 border border-green-200">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700 border border-slate-200">
                          Encerrado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/cliente/${contract.customer_id}`); }}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
                      >
                        {contract.customerName}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600">{contract.customerCPF}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">{contract.vehicle_plate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm font-medium">{formatDate(contract.start_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">{calculateDuration(contract.start_date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-green-600 font-black">
                        <span>R$ {contract.monthly_rate?.toFixed(2) ?? '0.00'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredContracts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Contratos Ativos</p>
              <p className="text-3xl font-black text-green-700">
                {filteredContracts.filter((c) => c.status === "ACTIVE").length}
              </p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1">Contratos Encerrados</p>
              <p className="text-3xl font-black text-slate-700">
                {filteredContracts.filter((c) => c.status === "ENDED").length}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Receita Mensal Ativa</p>
              <p className="text-3xl font-black text-blue-700">
                R${" "}
                {filteredContracts
                  .filter((c) => c.status === "ACTIVE")
                  .reduce((sum, c) => sum + c.monthly_rate, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
