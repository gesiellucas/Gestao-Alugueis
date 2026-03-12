'use client';
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppContext } from "../../../contexts/AppContext";
import { VEHICLE_STATUS_IDS } from "../../../types";
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
import { ModuleHeader } from "@/components/ModuleHeader";

export const VeiculoDetalhePage: React.FC = () => {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const { vehicles, customers, maintenanceRecords, rentalContracts, handleEndRental } =
    useAppContext();
  const [endingRental, setEndingRental] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const vehicle = vehicles.find((v) => v.id === id);

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

  const vehicleRentals = rentalContracts
    .filter((c) => c.vehicle_id === vehicle.id)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  const statusColor = vehicle.vehicleStatus?.color || "#6b7280";
  const statusName = vehicle.vehicleStatus?.name || "Desconhecido";

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

      <ModuleHeader 
        title={`${vehicle.plate}`} 
        subtitle={vehicle.model?.name || 'Moto'} 
        breadcrumbs={[
          { label: "Veículos", href: "/veiculos" },
          { label: vehicle.plate }
        ]}
        extraHeader={<span
        className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
        style={{
          backgroundColor: `${statusColor}20`,
          color: statusColor,
          borderColor: `${statusColor}40`,
        }}
      >
        {statusName}
      </span>} />

      < div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" >
        <button
          onClick={() => router.push("/veiculos")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar para Frota
        </button>
        <div className="flex items-center gap-3">
          {vehicle.status_id === VEHICLE_STATUS_IDS.AVAILABLE && (
            <Link
              href={`/aluguel/novo/${vehicle.id}`}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2 text-sm"
            >
              <KeyRound size={16} /> Alugar Moto
            </Link>
          )}
          {vehicle.status_id === VEHICLE_STATUS_IDS.RENTED && (
            <button
              onClick={() => setShowEndConfirm(true)}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all flex items-center gap-2 text-sm"
            >
              <XCircle size={16} /> Encerrar Contrato
            </button>
          )}
          {vehicle.status_id !== VEHICLE_STATUS_IDS.MAINTENANCE && (
            <Link
              href={`/oficina/novo_entrada?plate=${vehicle.plate}`}
              className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-all flex items-center gap-2 text-sm"
            >
              <Wrench size={16} /> Enviar para Oficina
            </Link>
          )}
          <Link
            href={`/veiculo/editar/${vehicle.id}`}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 text-sm"
          >
            <Pencil size={16} /> Editar Veículo
          </Link>
        </div>
      </div >

      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-extrabold text-[#1a4fd6]">
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
          <div className="h-48 lg:h-auto bg-[#f8fafc] flex items-center justify-center p-6">
            <img
              src={vehicle.model?.image_url || undefined}
              alt={vehicle.model?.name || 'Moto'}
              className="max-w-full max-h-40 object-contain drop-shadow-xl"
            />
          </div>

          <div className="p-8 flex flex-col justify-center gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded uppercase">
                  {vehicle.model?.brand || "Marca"}
                </span>
                <span
                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border"
                  style={{
                    backgroundColor: `${statusColor}20`,
                    color: statusColor,
                    borderColor: `${statusColor}40`,
                  }}
                >
                  {statusName}
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-[#1a4fd6] leading-tight">
                {vehicle.model?.name || "Modelo"}
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <Hash size={12} /> Placa
                </span>
                <span className="font-black text-slate-700 font-mono tracking-tight">{vehicle.plate}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <Calendar size={12} /> Ano
                </span>
                <span className="font-bold text-slate-700">{vehicle.year}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <Circle size={12} /> Quilometragem
                </span>
                <span className="font-bold text-slate-700">{vehicle.mileage.toLocaleString()} km</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                  <User size={12} /> Locatário
                </span>
                {renter ? (
                  <Link
                    href={`/cliente/${renter.id}`}
                    className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {renter.name}
                  </Link>
                ) : (
                  <span className="font-bold text-slate-400">Nenhum</span>
                )}
              </div>
              {renter && (
                <div className="flex items-center justify-between py-3">
                  <span className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <User size={12} /> Telefone
                  </span>
                  <span className="font-bold text-slate-700">{renter.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rental History Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-blue-50">
          <KeyRound size={18} className="text-blue-600" />
          <h3 className="font-black text-[#1a4fd6] uppercase tracking-tight text-sm">
            Histórico de Aluguéis
          </h3>
          <span className="ml-auto bg-blue-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
            {vehicleRentals.length}
          </span>
        </div>
        {vehicleRentals.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-medium text-sm">
            Nenhum aluguel registrado para este veículo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Início</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Término</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Valor/mês</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Situação</th>
                </tr>
              </thead>
              <tbody>
                {vehicleRentals.map((contract) => {
                  const contractCustomer = customers.find((c) => c.id === contract.customer_id);
                  return (
                    <tr key={contract.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        {contractCustomer ? (
                          <Link
                            href={`/cliente/${contractCustomer.id}`}
                            className="font-bold text-[#1a4fd6] hover:text-blue-600 transition-colors"
                          >
                            {contractCustomer.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {new Date(contract.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {contract.end_date
                          ? new Date(contract.end_date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {contract.monthly_rate.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </td>
                      <td className="px-6 py-4">
                        {contract.status === "ACTIVE" ? (
                          <span className="bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-green-200 inline-flex items-center gap-1">
                            <CheckCircle size={10} /> Ativo
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-slate-200">
                            Encerrado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Maintenance History Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <Wrench size={18} className="text-slate-500" />
          <h3 className="font-black text-[#1a4fd6] uppercase tracking-tight text-sm">
            Histórico de Manutenção
          </h3>
          <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-black px-2.5 py-0.5 rounded-full">
            {vehicleRecords.length}
          </span>
        </div>
        {vehicleRecords.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-medium text-sm">
            Nenhuma manutenção registrada para este veículo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Mecânico</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Observação</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Entrada</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Conclusão</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Situação</th>
                </tr>
              </thead>
              <tbody>
                {vehicleRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#1a4fd6]">{record.type}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{record.mechanic_name}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{record.description}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      {new Date(record.entry_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      {record.completion_date
                        ? new Date(record.completion_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {record.status === "OPEN" ? (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-200 inline-flex items-center gap-1">
                          <Wrench size={10} /> Em andamento
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border border-green-200 inline-flex items-center gap-1">
                          <CheckCircle size={10} /> Concluído
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div >
  );
};
