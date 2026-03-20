'use client';
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { Search } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "../../../hooks/usePagination";
import { useFinanceAccess } from "../../../hooks/useFinanceAccess";
import { formatCPF, formatDate } from "../../../lib/formatters";

export const AlugueisPage: React.FC = () => {
  const { rentalContracts, customers, vehicles } = useAppContext();
  const router = useRouter();
  const hasFinanceAccess = useFinanceAccess();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

      const contractDate = new Date(contract.start_date).getTime();
      const matchesStartDate = !startDate || contractDate >= new Date(startDate).getTime();
      const matchesEndDate = !endDate || contractDate <= new Date(endDate).getTime();

      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [enrichedContracts, searchTerm, statusFilter, startDate, endDate]);

  const pagination = usePagination(filteredContracts, 10);

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
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue text-white rounded-xl text-sm font-medium hover:bg-brand-blue-dark transition-colors shadow-md shadow-blue-200 ring-1 ring-black/10"
            >
              Novo Aluguel
            </button>
          </div>
        } />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex flex-col lg:flex-row gap-4">
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
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">De</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Até</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none"
              />
            </div>

            <div className="flex gap-1 items-center bg-slate-100/50 p-1 rounded-xl border border-slate-100">
              {["TODOS", "ACTIVE", "ENDED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === status
                    ? "bg-white text-brand-blue shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-brand-blue hover:bg-white/50"
                    }`}
                >
                  {status === "TODOS" ? "Todos" : status === "ACTIVE" ? "Ativos" : "Encerrados"}
                </button>
              ))}
            </div>

            {(startDate || endDate || searchTerm || statusFilter !== "TODOS") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("TODOS");
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest px-2"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-blue text-white">
              <tr className="[&>th]:text-center [&>th]:px-6 [&>th]:py-4 [&>th]:text-left [&>th]:text-xs [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-widest">
                <th>Cliente</th>
                <th>CPF</th>
                <th>Placa</th>
                <th>Início</th>
                <th>Status</th>
                {hasFinanceAccess && <th>Valor Mensal</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagination.paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-slate-400 font-bold text-lg">Nenhum contrato encontrado</p>
                    <p className="text-slate-300 text-sm mt-1">Tente ajustar os filtros acima.</p>
                  </td>
                </tr>
              ) : (
                pagination.paginatedItems.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/alugueis/${contract.id}`)}
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/cliente/${contract.customer_id}`); }}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
                      >
                        {contract.customerName}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600">{formatCPF(contract.customerCPF)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-700">{contract.vehicle_plate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm font-medium">{formatDate(contract.start_date)}</span>
                        <span className="text-sm font-bold text-slate-700">{calculateDuration(contract.start_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {contract.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-widest bg-green-100 text-green-700 border border-green-200">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold uppercase tracking-widest bg-slate-100 text-slate-700 border border-slate-200">
                          Encerrado
                        </span>
                      )}
                    </td>
                    {hasFinanceAccess && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-green-600 font-bold">
                          <span>R$ {contract.monthly_rate?.toFixed(2) ?? '0.00'}</span>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      </div>
    </div>
  );
};
