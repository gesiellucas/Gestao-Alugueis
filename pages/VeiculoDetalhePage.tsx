import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import { VehicleStatus } from "../types";
import {
  ArrowLeft,
  Pencil,
  Hash,
  Circle,
  User,
  Calendar,
  Wrench,
  CheckCircle,
  KeyRound,
  XCircle,
} from "lucide-react";

export const VeiculoDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vehicles, customers, maintenanceRecords, rentalContracts, handleEndRental } =
    useAppContext();
  const [endingRental, setEndingRental] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const vehicle = vehicles.find((v) => v.id === id);

  if (!vehicle) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/veiculos")}
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

  const renter = vehicle.current_renter_id
    ? customers.find((c) => c.id === vehicle.current_renter_id)
    : null;
  const vehicleRecords = maintenanceRecords
    .filter((r) => r.vehicle_id === vehicle.id)
    .sort(
      (a, b) =>
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
    );

  const activeContract = rentalContracts.find(
    (c) => c.vehicle_id === vehicle.id && c.status === "ACTIVE",
  );

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

  const onEndRental = async () => {
    setEndingRental(true);
    try {
      await handleEndRental(vehicle.id);
      setShowEndConfirm(false);
    } catch {
      // error handled in context
    } finally {
      setEndingRental(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => navigate("/veiculos")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar para Frota
        </button>
        <div className="flex items-center gap-3">
          {vehicle.status === VehicleStatus.AVAILABLE && (
            <Link
              to={`/aluguel/novo/${vehicle.id}`}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2 text-sm"
            >
              <KeyRound size={16} /> Alugar Moto
            </Link>
          )}
          {vehicle.status === VehicleStatus.RENTED && (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all flex items-center gap-2 text-sm"
            >
              <XCircle size={16} /> Encerrar Contrato
            </button>
          )}
          <Link
            to={`/veiculo/editar/${vehicle.id}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 text-sm"
          >
            <Pencil size={16} /> Editar Veículo
          </Link>
        </div>
      </div>

      {/* Modal de confirmação para encerrar contrato */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-extrabold text-[#0a2342]">
              Encerrar Contrato
            </h3>
            <p className="text-slate-600">
              Tem certeza que deseja encerrar o contrato de aluguel
              {renter && (
                <span className="font-bold"> de {renter.name}</span>
              )}{" "}
              para o veículo{" "}
              <span className="font-bold font-mono">{vehicle.plate}</span>?
            </p>
            {activeContract && (
              <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
                <p className="text-slate-500">
                  <span className="font-bold text-slate-700">Início:</span>{" "}
                  {new Date(activeContract.start_date).toLocaleDateString()}
                </p>
                <p className="text-slate-500">
                  <span className="font-bold text-slate-700">Valor mensal:</span>{" "}
                  R$ {activeContract.monthly_rate.toFixed(2)}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                disabled={endingRental}
                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onEndRental}
                disabled={endingRental}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {endingRental ? "Encerrando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Image */}
          <div className="h-72 lg:h-auto bg-[#f8fafc] flex items-center justify-center p-10">
            <img
              src={vehicle.image_url}
              alt={vehicle.model}
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
            />
          </div>

          {/* Info */}
          <div className="p-10 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded uppercase">
                  Honda
                </span>
                <span className="text-sm font-bold text-slate-400">
                  {vehicle.year}
                </span>
                <span
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(vehicle.status)}`}
                >
                  {vehicle.status}
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-[#0a2342] leading-tight">
                {vehicle.model}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-5 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Hash size={12} /> Placa
                </p>
                <p className="text-xl font-black text-slate-700 font-mono tracking-tighter">
                  {vehicle.plate}
                </p>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Circle size={12} /> Quilometragem
                </p>
                <p className="text-xl font-black text-slate-700">
                  {vehicle.mileage.toLocaleString()} km
                </p>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <Calendar size={12} /> Ano
                </p>
                <p className="text-xl font-black text-slate-700">
                  {vehicle.year}
                </p>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <User size={12} /> Locatário
                </p>
                <p className="text-xl font-black text-slate-700">
                  {renter ? renter.name : "Nenhum"}
                </p>
              </div>
            </div>

            {renter && (
              <Link
                to={`/cliente/${renter.id}`}
                className="block p-5 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">
                  Parceiro Vinculado
                </p>
                <p className="font-extrabold text-blue-900 text-lg">
                  {renter.name}
                </p>
                <p className="text-sm text-blue-600 font-medium">
                  {renter.phone}
                </p>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance History */}
      {vehicleRecords.length > 0 && (
        <div>
          <h3 className="text-xl font-extrabold text-[#0a2342] mb-4 uppercase tracking-tight">
            Histórico de Manutenção
          </h3>
          <div className="space-y-4">
            {vehicleRecords.map((record) => (
              <div
                key={record.id}
                className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${record.status === "OPEN" ? "border-amber-500" : "border-green-500"}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {record.status === "OPEN" ? (
                        <Wrench size={16} className="text-amber-500" />
                      ) : (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                      <span
                        className={`text-xs font-black uppercase ${record.status === "OPEN" ? "text-amber-600" : "text-green-600"}`}
                      >
                        {record.status === "OPEN"
                          ? "Em Andamento"
                          : "Concluído"}
                      </span>
                    </div>
                    <p className="font-bold text-[#0a2342]">{record.type}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {record.description}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-slate-400 font-medium">
                      Entrada: {new Date(record.entry_date).toLocaleDateString()}
                    </p>
                    {record.completion_date && (
                      <p className="text-green-600 font-medium">
                        Saída:{" "}
                        {new Date(record.completion_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
