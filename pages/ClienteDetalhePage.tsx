import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../contexts/AppContext";
import {
  ArrowLeft,
  Pencil,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Bike,
} from "lucide-react";

export const ClienteDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customers, vehicles } = useAppContext();

  const customer = customers.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/clientes")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar para Parceiros
        </button>
        <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm">
          <p className="text-slate-500 font-medium text-lg">
            Cliente não encontrado.
          </p>
        </div>
      </div>
    );
  }

  const vehicle = vehicles.find((v) => v.current_renter_id === customer.id);
  const hasDebt = customer.balance_due > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button
          onClick={() => navigate("/clientes")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> Voltar para Parceiros
        </button>
        <Link
          to={`/cliente/editar/${customer.id}`}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 text-sm"
        >
          <Pencil size={16} /> Editar Cliente
        </Link>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-10">
          {/* Header */}
          <div className="flex items-start gap-6 mb-8">
            <div className="w-20 h-20 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-3xl border border-blue-100">
              {customer.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-extrabold text-[#0a2342]">
                  {customer.name}
                </h2>
                {customer.active_contract ? (
                  <span className="bg-green-100 text-green-700 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest border border-green-200 flex items-center gap-1">
                    <CheckCircle size={12} /> Ativo
                  </span>
                ) : (
                  <span className="bg-slate-100 text-slate-500 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest border border-slate-200">
                    Inativo
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                <span className="flex items-center gap-1">
                  <FileText size={14} /> CPF: {customer.cpf}
                </span>
                <span className="flex items-center gap-1">
                  <Phone size={14} /> {customer.phone}
                </span>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Financial Status */}
            <div
              className={`p-6 rounded-xl border ${hasDebt ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest ${hasDebt ? "text-red-400" : "text-green-400"}`}
                  >
                    {hasDebt ? "Débito Pendente" : "Situação Financeira"}
                  </p>
                  <p
                    className={`font-black text-3xl mt-2 ${hasDebt ? "text-red-600" : "text-green-600"}`}
                  >
                    R$ {customer.balance_due.toFixed(2)}
                  </p>
                  {customer.last_payment_date && (
                    <p className="text-xs text-slate-400 font-medium mt-2">
                      Último pagamento:{" "}
                      {new Date(customer.last_payment_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {hasDebt ? (
                  <AlertCircle className="text-red-400" size={32} />
                ) : (
                  <CheckCircle className="text-green-400" size={32} />
                )}
              </div>
            </div>

            {/* Vehicle */}
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Bike size={12} /> Veículo Vinculado
              </p>
              {vehicle ? (
                <Link
                  to={`/veiculo/${vehicle.id}`}
                  className="block hover:bg-slate-100 -m-2 p-2 rounded-xl transition-colors"
                >
                  <p className="font-extrabold text-[#0a2342] text-lg">
                    {vehicle.model}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-black bg-blue-600 text-white px-2 py-1 rounded">
                      {vehicle.plate}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">
                      {vehicle.mileage.toLocaleString()} km
                    </span>
                  </div>
                </Link>
              ) : (
                <p className="text-slate-500 font-medium text-lg">
                  Nenhum veículo vinculado
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() =>
                window.open(`https://wa.me/${customer.phone}`, "_blank")
              }
              className="flex-1 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-green-100"
            >
              <MessageSquare size={18} /> Enviar WhatsApp
            </button>
            <Link
              to={`/cliente/editar/${customer.id}`}
              className="py-4 px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-colors flex items-center gap-2"
            >
              <Pencil size={18} /> Editar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
