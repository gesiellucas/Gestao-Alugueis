import React, { useState } from "react";
import {
  MaintenanceRecord,
  Vehicle,
  MaintenanceType,
  VEHICLE_STATUS_IDS,
} from "../../../types";
// Fixed: Added missing X icon to the lucide-react imports
import {
  PlusCircle,
  CheckCircle,
  Clock,
  ShieldAlert,
  X,
} from "lucide-react";

interface WorkshopProps {
  vehicles: Vehicle[];
  records: MaintenanceRecord[];
  onAddRecord: (record: MaintenanceRecord) => void;
  onFinishMaintenance: (recordId: string) => void;
}

export const Workshop: React.FC<WorkshopProps> = ({
  vehicles,
  records,
  onAddRecord,
  onFinishMaintenance,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<MaintenanceRecord>>({
    type: MaintenanceType.PREVENTIVE,
    description: "",
    mechanic_name: "",
  });
  const [selectedPlate, setSelectedPlate] = useState("");

  const activeRecords = records.filter((r) => r.status === "OPEN");
  const historyRecords = records
    .filter((r) => r.status === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime(),
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find((v) => v.plate === selectedPlate);
    if (!vehicle || !newRecord.mechanic_name || !newRecord.description) return;

    const record: MaintenanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      vehicle_id: vehicle.id,
      vehicle_plate: vehicle.plate,
      entry_date: new Date().toISOString(),
      status: "OPEN",
      cost: 0,
      type: newRecord.type as MaintenanceType,
      mechanic_name: newRecord.mechanic_name!,
      description: newRecord.description!,
    };

    onAddRecord(record);
    setShowForm(false);
    setNewRecord({
      type: MaintenanceType.PREVENTIVE,
      description: "",
      mechanic_name: "",
    });
    setSelectedPlate("");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1a4fd6] uppercase tracking-tight">
            Oficina
          </h2>
          <p className="text-slate-500 font-medium">
            Controle de manutenção preventiva e corretiva.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-xl flex items-center gap-2 font-black shadow-lg shadow-amber-100 transition-all uppercase tracking-wider"
        >
          <PlusCircle size={20} />
          Registrar Entrada
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[#1a4fd6]/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#1a4fd6] p-8 flex justify-between items-center text-white">
              <h3 className="font-black text-xl uppercase tracking-tighter">
                Entrada de Veículo
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Moto da Frota
                </label>
                <select
                  className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 focus:border-blue-500 transition-all border appearance-none"
                  value={selectedPlate}
                  onChange={(e) => setSelectedPlate(e.target.value)}
                  required
                >
                  <option value="">Selecione a placa...</option>
                  {vehicles
                    .filter((v) => v.status_id !== VEHICLE_STATUS_IDS.MAINTENANCE)
                    .map((v) => (
                      <option key={v.id} value={v.plate}>
                        {v.plate} - {v.model?.name || 'Modelo desconhecido'}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Tipo de Serviço
                </label>
                <select
                  className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 border"
                  value={newRecord.type}
                  onChange={(e) =>
                    setNewRecord({
                      ...newRecord,
                      type: e.target.value as MaintenanceType,
                    })
                  }
                >
                  {Object.values(MaintenanceType).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Mecânico Responsável
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 border"
                  value={newRecord.mechanic_name}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, mechanic_name: e.target.value })
                  }
                  placeholder="Nome do técnico"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Observações Técnicas
                </label>
                <textarea
                  className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#1a4fd6]/10 border resize-none"
                  rows={3}
                  value={newRecord.description}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, description: e.target.value })
                  }
                  placeholder="Descreva o que será feito..."
                  required
                />
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#1a4fd6] text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Maintenance Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-amber-50">
          <ShieldAlert size={18} className="text-amber-500" />
          <h3 className="font-black text-[#1a4fd6] uppercase tracking-tight text-sm">
            Em Manutenção Agora
          </h3>
          <span className="ml-auto bg-amber-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
            {activeRecords.length}
          </span>
        </div>
        {activeRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-sm">
            Nenhum veículo em manutenção no momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Placa</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Mecânico</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Observação</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Entrada</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {activeRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-50 hover:bg-amber-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-lg text-sm uppercase tracking-tight">
                        {record.vehicle_plate}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#1a4fd6]">{record.type}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{record.mechanic_name}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{record.description}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} />
                        {new Date(record.entry_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onFinishMaintenance(record.id)}
                        className="bg-green-500 hover:bg-green-600 text-white font-black px-4 py-2 rounded-xl transition-all shadow-sm shadow-green-100 uppercase text-xs tracking-widest flex items-center gap-1.5 ml-auto"
                      >
                        <CheckCircle size={14} />
                        Finalizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <CheckCircle size={18} className="text-green-500" />
          <h3 className="font-black text-[#1a4fd6] uppercase tracking-tight text-sm">
            Histórico de Manutenções
          </h3>
          <span className="ml-auto bg-slate-200 text-slate-600 text-xs font-black px-2.5 py-0.5 rounded-full">
            {historyRecords.length}
          </span>
        </div>
        {historyRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-sm">
            Nenhuma manutenção concluída ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Placa</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Mecânico</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Observação</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Entrada</th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-400 uppercase tracking-widest">Custo</th>
                </tr>
              </thead>
              <tbody>
                {historyRecords.map((record) => (
                  <tr key={record.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-lg text-sm uppercase tracking-tight">
                        {record.vehicle_plate}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#1a4fd6]">{record.type}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{record.mechanic_name}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{record.description}</td>
                    <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                      {new Date(record.entry_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {record.cost != null
                        ? record.cost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
