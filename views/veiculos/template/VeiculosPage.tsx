'use client';
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../../contexts/AppContext";
import { VEHICLE_STATUS_IDS } from "../../../types";
import { PlusCircle, Search, ChevronDown, ChevronUp, ChevronsUpDown, Wrench, User } from "lucide-react";

type SortKey = "brand" | "model" | "year" | "plate" | "mileage" | "monthly_rate" | "status" | "renter";
type SortDir = "asc" | "desc";

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={13} className="text-slate-300" />;
  return sortDir === "asc"
    ? <ChevronUp size={13} className="text-blue-500" />
    : <ChevronDown size={13} className="text-blue-500" />;
}

export const VeiculosPage: React.FC = () => {
  const { vehicles, customers, rentalContracts, maintenanceRecords, vehicleStatuses } = useAppContext();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [plateFilter, setPlateFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("TODAS");
  const [sortKey, setSortKey] = useState<SortKey>("brand");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  // Build status style map from vehicleStatuses data
  const statusStyleMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of vehicleStatuses) {
      // Generate class based on color hex
      map[s.id] = `border`;
    }
    return map;
  }, [vehicleStatuses]);

  const statusNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of vehicleStatuses) {
      map[s.id] = s.name;
    }
    return map;
  }, [vehicleStatuses]);

  const tableRows = useMemo(() => {
    const rows = vehicles
      .filter((v) => {
        if (statusFilter !== "TODOS" && v.status_id !== statusFilter) return false;
        if (plateFilter && !v.plate.toLowerCase().includes(plateFilter.toLowerCase())) return false;
        if (brandFilter !== "TODAS" && v.model?.brand !== brandFilter) return false;
        return true;
      })
      .map((v) => {
        const contract = rentalContracts.find((c) => c.vehicle_id === v.id && c.status === "ACTIVE");
        const renter = v.current_renter_id ? customers.find((c) => c.id === v.current_renter_id) : null;
        const maintenance = maintenanceRecords.find((m) => m.vehicle_id === v.id && m.status === "OPEN");
        return {
          id: v.id,
          brand: v.model?.brand || "Desconhecida",
          model: v.model?.name || "Desconhecido",
          year: v.year,
          plate: v.plate,
          mileage: v.mileage,
          monthly_rate: contract?.monthly_rate ?? v.default_monthly_rate,
          status: v.vehicleStatus?.name || "Desconhecido",
          status_id: v.status_id,
          statusColor: v.vehicleStatus?.color || "#6b7280",
          renter: renter?.name ?? "",
          renterId: v.current_renter_id,
          maintenanceId: maintenance?.id,
        };
      });

    rows.sort((a, b) => {
      let va: string | number = a[sortKey] ?? "";
      let vb: string | number = b[sortKey] ?? "";
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [vehicles, customers, rentalContracts, maintenanceRecords, statusFilter, plateFilter, brandFilter, sortKey, sortDir, vehicleStatuses]);

  const Th = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      onClick={() => handleSort(col)}
      className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-blue-600 transition-colors whitespace-nowrap"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0a2342] uppercase tracking-tight">
            Veículos
          </h2>
          <p className="text-slate-500 font-medium">
            Gestão completa das motocicletas GC Locamoto.
          </p>
        </div>
        <Link
          href="/veiculo/novo_veiculo"
          className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2"
        >
          <PlusCircle size={20} />
          Nova Motocicleta
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 flex items-center gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por placa..."
              value={plateFilter}
              onChange={(e) => setPlateFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="TODOS">Todos os status</option>
            {vehicleStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tableRows.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 font-bold text-lg">Nenhum veículo encontrado</p>
          <p className="text-slate-300 text-sm mt-1">Tente ajustar os filtros acima.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <Th col="plate"        label="Placa" />
                  <Th col="model"        label="Modelo" />
                  <Th col="year"         label="Ano" />
                  <Th col="mileage"      label="Km" />
                  <Th col="renter"       label="Locatário / Situação" />
                  <Th col="status"       label="Status" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tableRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/veiculo/${row.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{row.plate}</td>
                    <td className="px-4 py-3 font-semibold text-[#0a2342]">{row.model}</td>
                    <td className="px-4 py-3 text-slate-500">{row.year}</td>
                    <td className="px-4 py-3 text-slate-600">{row.mileage.toLocaleString("pt-BR")} km</td>
                    <td className="px-4 py-3">
                      {row.status_id === VEHICLE_STATUS_IDS.RENTED && row.renterId ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/cliente/${row.renterId}`); }}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <User size={13} />
                          {row.renter || "Ver locatário"}
                        </button>
                      ) : row.status_id === VEHICLE_STATUS_IDS.MAINTENANCE && row.maintenanceId ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/oficina/${row.maintenanceId}`); }}
                          className="inline-flex items-center gap-1.5 text-amber-600 hover:text-amber-800 font-semibold"
                        >
                          <Wrench size={13} />
                          Ver ticket
                        </button>
                      ) : (
                        <span className="text-green-600 font-semibold text-xs">Disponível</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border"
                        style={{
                          backgroundColor: `${row.statusColor}20`,
                          color: row.statusColor,
                          borderColor: `${row.statusColor}40`,
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
