'use client';
import React, { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { Search, SlidersHorizontal, ArrowUpDown, X, ChevronUp, ChevronDown } from "lucide-react";
import { ModuleHeader } from "@/components/ModuleHeader";
import { TablePagination } from "@/components/TablePagination";
import { usePagination } from "../../../hooks/usePagination";
import { useFinanceAccess } from "../../../hooks/useFinanceAccess";
import { formatCPF, formatDate } from "../../../lib/formatters";

type SortField = "start_date" | "customerName";
type SortOrder = "asc" | "desc";

export const AlugueisPage: React.FC = () => {
  const { rentalContracts, customers, vehicles } = useAppContext();
  console.log(rentalContracts)
  const router = useRouter();
  const hasFinanceAccess = useFinanceAccess();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState<SortField>("start_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    const filtered = enrichedContracts.filter((contract) => {
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

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "start_date") {
        cmp = new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      } else {
        cmp = a.customerName.localeCompare(b.customerName, "pt-BR");
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [enrichedContracts, searchTerm, statusFilter, startDate, endDate, sortField, sortOrder]);

  const pagination = usePagination(filteredContracts, 10);

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

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="grid grid-cols-5 items-center gap-3">
          {/* Col 1-2: Busca */}
          <div className="col-span-2 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, placa, modelo ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
            />
          </div>

          {/* Col 3: espaçador */}
          <div />

          {/* Col 4: Filtro */}
          <div ref={filterRef} className="relative">
            {(() => {
              const hasFilter = statusFilter !== "TODOS" || !!startDate || !!endDate;
              return (
                <>
                  <button
                    onClick={() => { setFilterOpen((o) => !o); setSortOpen(false); }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-colors ${hasFilter ? "bg-brand-blue text-white border-brand-blue" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                  >
                    <SlidersHorizontal size={14} />
                    Filtrar
                    {hasFilter && (
                      <span className="ml-1 bg-white/30 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                        {[statusFilter !== "TODOS", !!startDate, !!endDate].filter(Boolean).length}
                      </span>
                    )}
                  </button>

                  {filterOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Filtros</p>
                        {hasFilter && (
                          <button
                            onClick={() => { setStatusFilter("TODOS"); setStartDate(""); setEndDate(""); }}
                            className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest flex items-center gap-1"
                          >
                            <X size={10} /> Limpar
                          </button>
                        )}
                      </div>

                      {/* Status */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                        <div className="flex gap-1 bg-slate-100/60 p-1 rounded-xl border border-slate-100">
                          {["TODOS", "ACTIVE", "ENDED"].map((s) => (
                            <button
                              key={s}
                              onClick={() => setStatusFilter(s)}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === s ? "bg-white text-brand-blue shadow-sm border border-slate-200" : "text-slate-500 hover:text-brand-blue"}`}
                            >
                              {s === "TODOS" ? "Todos" : s === "ACTIVE" ? "Ativos" : "Encerrados"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Data */}
                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Período</p>
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex-1 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">De</span>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 min-w-0 bg-transparent text-xs font-medium text-slate-700 focus:outline-none" />
                          </div>
                          <div className="flex-1 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Até</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 min-w-0 bg-transparent text-xs font-medium text-slate-700 focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Col 5: Ordenação */}
          <div ref={sortRef} className="relative">
            {(() => {
              const sortLabel = sortField === "start_date" ? "Início" : "Cliente";
              return (
                <>
                  <button
                    onClick={() => { setSortOpen((o) => !o); setFilterOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-bold transition-colors"
                  >
                    <ArrowUpDown size={14} />
                    {sortLabel}
                    {sortOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                      <p className="px-4 pt-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ordenar por</p>
                      {(["start_date", "customerName"] as SortField[]).map((field) => {
                        const label = field === "start_date" ? "Data de início" : "Cliente (A-Z)";
                        const isActive = sortField === field;
                        return (
                          <button
                            key={field}
                            onClick={() => {
                              if (isActive) setSortOrder((o) => o === "asc" ? "desc" : "asc");
                              else { setSortField(field); setSortOrder("desc"); }
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors ${isActive ? "text-brand-blue bg-blue-50" : "text-slate-600 hover:bg-slate-50"}`}
                          >
                            {label}
                            {isActive && (sortOrder === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-brand-blue text-white">
              <tr className="[&>th]:px-6 [&>th]:py-4 [&>th]:text-left [&>th]:text-xs [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-widest">
                <th>Cliente</th>
                <th>Placa</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Status</th>
                {hasFinanceAccess && <th>Valor Contratual</th>}
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
                        className="flex flex-col items-start text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors text-left"
                      >
                        <span className="text-[10px] bg-brand-blue/10 text-brand-blue px-2 py-1 rounded-lg">{formatCPF(contract.customerCPF)}</span>
                        <span>{contract.customerName}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-700">{contract.vehicle_plate}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="text-sm font-medium">{formatDate(contract.start_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {contract.end_date ? (
                        <span className="text-sm font-medium text-slate-600">{formatDate(contract.end_date)}</span>
                      ) : (
                        <span className="text-sm text-slate-300 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {contract.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Encerrado
                        </span>
                      )}
                    </td>
                    {hasFinanceAccess && (
                      <td className="px-6 py-4">
                        <div className="flex text-xs items-center gap-1.5 text-green-600 font-bold">
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
