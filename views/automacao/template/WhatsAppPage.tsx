'use client';
import React, { useState } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import { generateWhatsAppMessage } from '../../../services/geminiService';
import { Customer } from '../../../types';
import { MessageSquare, Send, Sparkles, AlertCircle } from 'lucide-react';

export const WhatsAppPage: React.FC = () => {
  const { customers, vehicles } = useAppContext();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const pendingCustomers = customers.filter(c => c.balance_due > 0);

  const handleGenerateMessage = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsGenerating(true);
    setGeneratedMessage('');

    const rentedVehicle = vehicles.find(v => v.current_renter_id === customer.id);
    const vehicleName = rentedVehicle?.model?.name || 'sua moto alugada';

    const message = await generateWhatsAppMessage(customer.name, customer.balance_due, vehicleName);

    setGeneratedMessage(message);
    setIsGenerating(false);
  };

  const sendWhatsApp = () => {
    if (!selectedCustomer) return;
    const text = encodeURIComponent(generatedMessage);
    const url = `https://wa.me/${selectedCustomer.phone}?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-[#0a2342] uppercase tracking-tight">Cobranças & Automação</h2>
        <p className="text-slate-500 font-medium">Gestão de pagamentos pendentes e disparos via WhatsApp API (Simulado).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <AlertCircle className="text-red-500" size={18} />
            Pendências ({pendingCustomers.length})
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {pendingCustomers.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">Nenhum cliente com débito.</div>
            ) : (
              pendingCustomers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => handleGenerateMessage(customer)}
                  className={`w-full p-4 text-left transition-colors hover:bg-slate-50 ${selectedCustomer?.id === customer.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-slate-900">{customer.name}</p>
                      <p className="text-xs text-slate-500">Venc: {customer.last_payment_date}</p>
                    </div>
                    <span className="text-red-600 font-bold text-sm">R$ {customer.balance_due.toFixed(2)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Editor de Mensagem</h3>
              {selectedCustomer && (
                <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                  Para: {selectedCustomer.phone}
                </span>
              )}
            </div>

            <div className="flex-1 p-6 flex flex-col justify-center">
              {!selectedCustomer ? (
                <div className="text-center text-slate-400">
                  <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Selecione um cliente ao lado para gerar a cobrança.</p>
                </div>
              ) : (
                <div className="space-y-4 w-full">
                  <div className="relative">
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Mensagem (Gerada por IA)</label>
                    <textarea
                      value={generatedMessage}
                      onChange={(e) => setGeneratedMessage(e.target.value)}
                      disabled={isGenerating}
                      className="w-full h-48 p-4 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-slate-50"
                    />
                    {isGenerating && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-indigo-600 font-medium animate-pulse">
                          <Sparkles size={20} />
                          Criando mensagem personalizada...
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleGenerateMessage(selectedCustomer)}
                      disabled={isGenerating}
                      className="flex-1 py-3 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles size={18} />
                      Regerar
                    </button>
                    <button
                      onClick={sendWhatsApp}
                      disabled={!generatedMessage || isGenerating}
                      className="flex-[2] py-3 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <Send size={18} />
                      Enviar via WhatsApp
                    </button>
                  </div>
                  <p className="text-xs text-center text-slate-400 mt-2">
                    Isso abrirá o aplicativo do WhatsApp Web ou Mobile com a mensagem pré-preenchida.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
