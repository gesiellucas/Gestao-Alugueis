import React from "react";
import { Customer, Vehicle } from "../../../types";
import {
  User,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Search,
  PlusCircle,
} from "lucide-react";

interface CustomerManagerProps {
  customers: Customer[];
  vehicles: Vehicle[];
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers,
  vehicles,
}) => {
  // Helper to find which vehicle a customer is using
  const getCustomerVehicle = (customerId: number) => {
    return vehicles.find((v) => v.current_renter_id === customerId);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#004AAD] uppercase tracking-tight">
            Clientes
          </h2>
          <p className="text-slate-500 font-medium">
            Gestão de clientes e contratos ativos.
          </p>
        </div>
        <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2 uppercase tracking-widest text-xs">
          <PlusCircle size={18} />
          Novo Cliente
        </button>
      </div>

      <div className="relative group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
          size={20}
        />
        <input
          type="text"
          placeholder="Buscar Cliente por nome, CPF ou placa..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 transition-all font-medium text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {customers.map((customer) => {
          const vehicle = getCustomerVehicle(customer.id);
          const hasDebt = customer.balance_due > 0;

          return (
            <div
              key={customer.id}
              className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-2xl border border-blue-100">
                    {customer.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    {customer.active_contract ? (
                      <span className="bg-green-100 text-green-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-green-200 flex items-center gap-1">
                        <CheckCircle size={10} /> Ativo
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">
                        Inativo
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-extrabold text-[#004AAD] mb-1">
                    {customer.name}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                    <FileText size={14} />
                    <span>CPF: {customer.cpf}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Veículo Atual
                      </p>
                      <p className="font-bold text-slate-700">
                        {vehicle?.model?.name || "Nenhum"}
                      </p>
                    </div>
                    {vehicle && (
                      <p className="text-xs font-black bg-blue-600 text-white px-2 py-1 rounded">
                        {vehicle.plate}
                      </p>
                    )}
                  </div>

                  <div
                    className={`p-4 rounded-xl flex items-center justify-between border ${hasDebt ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}
                  >
                    <div>
                      <p
                        className={`text-[10px] font-black uppercase tracking-widest ${hasDebt ? "text-red-400" : "text-green-400"}`}
                      >
                        {hasDebt ? "Débito Pendente" : "Situação Financeira"}
                      </p>
                      <p
                        className={`font-black text-lg ${hasDebt ? "text-red-600" : "text-green-600"}`}
                      >
                        R$ {customer.balance_due.toFixed(2)}
                      </p>
                    </div>
                    {hasDebt ? (
                      <AlertCircle className="text-red-400" size={24} />
                    ) : (
                      <CheckCircle className="text-green-400" size={24} />
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      window.open(`https://wa.me/${customer.phone}`, "_blank")
                    }
                    className="flex-1 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-green-100"
                  >
                    <MessageSquare size={16} />
                    WhatsApp
                  </button>
                  <button className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
                    <User size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
