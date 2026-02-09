import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Hash, Circle, User, DollarSign, Wrench, Image } from "lucide-react";
import { VehicleStatus } from "../types";

interface VehicleCardProps {
  id: string;
  image_url: string;
  model: string;
  status: VehicleStatus;
  year: number;
  brand: string;
  plate: string;
  mileage: number;
  current_renter_id?: string | null;
  renterName?: string;
  monthly_rate: number;
  maintenanceId?: string;
}

const getStatusStyle = (status: `${VehicleStatus}`) => {
  switch (status) {
    case VehicleStatus.AVAILABLE:
      return "bg-green-100 text-green-700 border-green-200";
    case VehicleStatus.RENTED:
      return "bg-blue-100 text-blue-700 border-blue-200";
    case VehicleStatus.MAINTENANCE:
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export const VehicleCard = ({
  id,
  image_url,
  model,
  status,
  year,
  brand,
  plate,
  mileage,
  current_renter_id,
  renterName,
  monthly_rate,
  maintenanceId,
}: VehicleCardProps) => {
  const navigate = useNavigate();

  const handleClientClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (current_renter_id) {
      navigate(`/cliente/${current_renter_id}`);
    }
  };

  const handleMaintenanceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (maintenanceId) {
      navigate(`/oficina/${maintenanceId}`);
    }
  };

  return (
    <Link
      to={`/veiculo/${id}`}
      className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block"
    >
      <div className="h-48 bg-[#f8fafc] relative flex items-center justify-center p-6">
        <img src={image_url} alt={model} />
        <div className="absolute top-4 right-4">
          <span
            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(status)}`}
          >
            {status}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
            {brand}
          </span>
          <span className="text-xs font-bold text-slate-400">{year}</span>
        </div>
        <h3 className="text-md font-extrabold text-[#0a2342] leading-tight">
          {model}
        </h3>

        <div className="flex flex-col [&>p]:text-sm [&>p]:font-black [&>p]:text-slate-700 [&>p>span]:font-normal py-4">
          <p>
            Placa: <span>{plate}</span>
          </p>
          <p>
            Km: <span>{mileage.toLocaleString()}</span>
          </p>
          <p>
            Valor: <span>R$ {monthly_rate.toFixed(2)}</span>
          </p>
        </div>

        <div className="space-y-3">
          {status === VehicleStatus.RENTED && current_renter_id ? (
            <div
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
              onClick={handleClientClick}
            >
              <div className="bg-blue-600 p-2 rounded-full text-white">
                <User size={14} />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-[10px] font-bold text-blue-600 uppercase">
                  Locatário Atual
                </p>
                <p className="text-xs font-black text-blue-900 truncate">
                  {renterName || "Parceiro Ativo"}
                </p>
              </div>
            </div>
          ) : status === VehicleStatus.MAINTENANCE && maintenanceId ? (
            <div
              className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors cursor-pointer"
              onClick={handleMaintenanceClick}
            >
              <div className="bg-amber-600 p-2 rounded-full text-white">
                <Wrench size={14} />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-[10px] font-bold text-amber-600 uppercase">
                  Em Manutenção
                </p>
                <p className="text-xs font-black text-amber-900 truncate">
                  Ver Ticket
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full py-3 bg-green-500 text-white rounded-xl font-bold text-xs text-center uppercase">
              Disponível
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
