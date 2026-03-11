import React from "react";
import { Vehicle } from "../../../types";
import { Circle, User, Hash } from "lucide-react";

interface FleetProps {
  vehicles: Vehicle[];
}

export const FleetManager: React.FC<FleetProps> = ({ vehicles }) => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1a4fd6] uppercase tracking-tight">
            Frota Ativa
          </h2>
          <p className="text-slate-500 font-medium">
            Gestão completa das motocicletas GC Locamoto.
          </p>
        </div>
        <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
          Nova Motocicleta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {vehicles.map((vehicle) => {
          const statusColor = vehicle.vehicleStatus?.color || "#6b7280";
          const statusName = vehicle.vehicleStatus?.name || "Desconhecido";

          return (
            <div
              key={vehicle.id}
              className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="h-48 bg-[#f8fafc] relative flex items-center justify-center p-6">
                <img
                  src={vehicle.model?.image_url || undefined}
                  alt={vehicle.model?.name || 'Moto'}
                  className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                />
                <div className="absolute top-4 right-4">
                  <span
                    className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border"
                    style={{
                      backgroundColor: `${statusColor}20`,
                      color: statusColor,
                      borderColor: `${statusColor}40`,
                    }}
                  >
                    {statusName}
                  </span>
                </div>
              </div>
              <div className="p-8">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                      {vehicle.model?.brand || "Marca"}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {vehicle.year}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-[#1a4fd6] leading-tight">
                    {vehicle.model?.name || 'Modelo desconhecido'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                      <Hash size={10} /> Placa
                    </p>
                    <p className="text-sm font-black text-slate-700 font-mono tracking-tighter">
                      {vehicle.plate}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                      <Circle size={10} /> Km
                    </p>
                    <p className="text-sm font-black text-slate-700">
                      {vehicle.mileage.toLocaleString()}
                    </p>
                  </div>
                </div>

                {vehicle.current_renter_id ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="bg-blue-600 p-2 rounded-full text-white">
                      <User size={14} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-bold text-blue-600 uppercase">
                        Locatário Atual
                      </p>
                      <p className="text-xs font-black text-blue-900 truncate">
                        Cliente Ativo
                      </p>
                    </div>
                  </div>
                ) : (
                  <button className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm transition-colors uppercase tracking-wider">
                    Disponibilizar Aluguel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
