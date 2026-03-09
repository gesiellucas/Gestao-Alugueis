import React, { useState } from "react";
import {
  MaintenanceRecord,
  Vehicle,
  MaintenanceType,
  VehicleStatus,
} from "../../../types";
// Fixed: Added missing X icon to the lucide-react imports
import {
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
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
          <h2 className="text-3xl font-extrabold text-[#0a2342] uppercase tracking-tight">
            Oficina GC
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
        <div className="fixed inset-0 bg-[#0a2342]/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#0a2342] p-8 flex justify-between items-center text-white">
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
                  className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all border appearance-none"
                  value={selectedPlate}
                  onChange={(e) => setSelectedPlate(e.target.value)}
                  required
                >
                  <option value="">Selecione a placa...</option>
                  {vehicles
                    .filter((v) => v.status !== VehicleStatus.MAINTENANCE)
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
                  className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 border"
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
                  className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 border"
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
                  className="w-full bg-slate-50 border-slate-200 rounded-xl p-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 border resize-none"
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
                  className="flex-1 py-4 bg-[#0a2342] text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-100 transition-all"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Maintenance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {activeRecords.map((record) => (
          <div
            key={record.id}
            className="bg-white rounded-[2.5rem] shadow-sm border-t-4 border-amber-500 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="bg-amber-50 px-4 py-2 rounded-xl">
                  <span className="font-black text-amber-700 text-xl tracking-tighter uppercase">
                    {record.vehicle_plate}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-full text-slate-400">
                  <ShieldAlert size={20} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Serviço
                  </p>
                  <p className="font-bold text-[#0a2342]">{record.type}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Observação
                  </p>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    {record.description}
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-50 flex items-center gap-2">
                  <Clock size={16} className="text-slate-300" />
                  <span className="text-xs font-bold text-slate-400">
                    Entrada: {new Date(record.entry_date).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => onFinishMaintenance(record.id)}
                  className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl transition-all shadow-md shadow-green-100 uppercase text-xs tracking-widest"
                >
                  Finalizar e Liberar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
