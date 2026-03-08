'use client';
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useAppContext } from "../contexts/AppContext";
import { VehicleStatus } from "../types";
import { PlusCircle, Search, ChevronDown } from "lucide-react";
import { VehicleCard } from "../components/VehicleCard";

export const VeiculosPage: React.FC = () => {
  const { vehicles, customers, rentalContracts, maintenanceRecords } =
    useAppContext();

  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [plateFilter, setPlateFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("TODAS");

  const brands = useMemo(() => {
    const set = new Set(vehicles.map((v) => v.model?.brand || "Desconhecida"));
    return Array.from(set).sort();
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    console.log("vehicles", vehicles);
    return vehicles.filter((v) => {
      if (statusFilter !== "TODOS" && v.status !== statusFilter) return false;
      if (
        plateFilter &&
        !v.plate.toLowerCase().includes(plateFilter.toLowerCase())
      )
        return false;
      if (brandFilter !== "TODAS" && v.model?.brand !== brandFilter)
        return false;
      return true;
    });
  }, [vehicles, statusFilter, plateFilter, brandFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0a2342] uppercase tracking-tight">
            Frota Ativa
          </h2>
          <p className="text-slate-500 font-medium">
            Gestão completa das motocicletas GC Loca Moto.
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

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {["TODOS", ...Object.values(VehicleStatus)].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                statusFilter === status
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por placa..."
              value={plateFilter}
              onChange={(e) => setPlateFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="appearance-none w-full sm:w-48 pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="TODAS">Todas as Marcas</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {filteredVehicles.map((vehicle) => {
          const contract = rentalContracts.find(
            (c) => c.vehicle_id === vehicle.id && c.status === "ACTIVE",
          );
          const renter = vehicle.current_renter_id
            ? customers.find((c) => c.id === vehicle.current_renter_id)
            : null;
          const maintenance = maintenanceRecords.find(
            (m) => m.vehicle_id === vehicle.id && m.status === "OPEN",
          );

          return (
            <VehicleCard
              key={vehicle.id}
              id={vehicle.id}
              image_url={vehicle.model?.image_url || ""}
              model={vehicle.model?.name || "Desconhecido"}
              status={vehicle.status}
              year={vehicle.year}
              brand={vehicle.model?.brand || "Desconhecido"}
              plate={vehicle.plate}
              mileage={vehicle.mileage}
              current_renter_id={vehicle.current_renter_id}
              renterName={renter?.name}
              monthly_rate={contract?.monthly_rate || vehicle.default_monthly_rate}
              maintenanceId={maintenance?.id}
            />
          );
        })}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-16">
          <p className="text-slate-400 font-bold text-lg">
            Nenhum veículo encontrado
          </p>
          <p className="text-slate-300 text-sm mt-1">
            Tente ajustar os filtros acima.
          </p>
        </div>
      )}
    </div>
  );
};
