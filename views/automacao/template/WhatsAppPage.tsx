'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import { Customer } from '../../../types';
import { MessageSquare, Send, AlertCircle, UserCheck, UserX, ChevronDown } from 'lucide-react';
import { ModuleHeader } from '@/components/ModuleHeader';

type FilterType = 'debt' | 'active' | 'inactive';
type MessageTypeKey = 'debt_collection' | 'payment_reminder' | 'welcome' | 'contract_renewal' | 'maintenance_notice' | 'return_invitation';

interface MessageTemplate {
  label: string;
  build: (customer: Customer, vehicleName: string) => string;
}

const MESSAGE_TEMPLATES: Record<MessageTypeKey, MessageTemplate> = {
  debt_collection: {
    label: 'Cobrança de Débito',
    build: (c, v) =>
      `Olá, *${c.name}*! 👋\n\nPassando para informar que identificamos um débito em aberto no valor de *R$ ${c.balance_due.toFixed(2)}* referente à locação da moto *${v}*.\n\nPara regularizar sua situação e evitar a suspensão do contrato, pedimos que efetue o pagamento o quanto antes.\n\nQualquer dúvida, estamos à disposição! 😊`,
  },
  payment_reminder: {
    label: 'Lembrete de Vencimento',
    build: (c, v) =>
      `Olá, *${c.name}*! 👋\n\nEste é um lembrete amigável de que o pagamento referente à locação da moto *${v}* está próximo do vencimento.\n\nEvite atrasos realizando o pagamento com antecedência. Contamos com você! 🙏`,
  },
  welcome: {
    label: 'Boas-vindas ao Cliente',
    build: (c, v) =>
      `Olá, *${c.name}*! Seja bem-vindo(a) à *GC Loca Moto*! 🎉\n\nFicamos felizes em tê-lo(a) conosco. Sua moto *${v}* está disponível conforme combinado.\n\nQualquer dúvida ou necessidade, é só nos chamar por aqui. Boa locação! 🏍️`,
  },
  contract_renewal: {
    label: 'Renovação de Contrato',
    build: (c, v) =>
      `Olá, *${c.name}*! 👋\n\nSeu contrato de locação da moto *${v}* está próximo do vencimento.\n\nGostaríamos de saber se tem interesse em renovar. Entre em contato para conversarmos sobre as melhores condições! 😊`,
  },
  maintenance_notice: {
    label: 'Aviso de Manutenção',
    build: (c, v) =>
      `Olá, *${c.name}*! 🔧\n\nInformamos que a moto *${v}* está com manutenção programada. Por favor, entre em contato para agendarmos a devolução temporária do veículo.\n\nAgradecemos a compreensão!`,
  },
  return_invitation: {
    label: 'Convite de Retorno',
    build: (c, _v) =>
      `Olá, *${c.name}*! 😊\n\nSentimos sua falta aqui na *GC Loca Moto*! Temos ótimas condições especiais para clientes que retornam.\n\nQue tal retomarmos sua locação? Entre em contato e veja nossas ofertas! 🏍️`,
  },
};

export const WhatsAppPage: React.FC = () => {
  const { customers, vehicles } = useAppContext();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [messageType, setMessageType] = useState<MessageTypeKey>('debt_collection');
  const [editedMessage, setEditedMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('debt');

  const filteredCustomers = customers.filter(c => {
    if (activeFilter === 'debt') return c.balance_due > 0;
    if (activeFilter === 'active') return c.active_contract;
    if (activeFilter === 'inactive') return !c.active_contract;
    return true;
  });

  const buildMessage = (customer: Customer, type: MessageTypeKey) => {
    const rentedVehicle = vehicles.find(v => v.current_renter_id === customer.id);
    const vehicleName = rentedVehicle?.model?.name || 'sua moto alugada';
    return MESSAGE_TEMPLATES[type].build(customer, vehicleName);
  };

  useEffect(() => {
    if (selectedCustomer) {
      setEditedMessage(buildMessage(selectedCustomer, messageType));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageType, selectedCustomer]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditedMessage(buildMessage(customer, messageType));
  };

  const sendWhatsApp = () => {
    if (!selectedCustomer) return;
    const text = encodeURIComponent(editedMessage);
    const url = `https://wa.me/${selectedCustomer.phone}?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <ModuleHeader title="Cobranças & Automação" subtitle="Gestão de pagamentos pendentes e disparos via WhatsApp." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100 p-6">
        {/* Lista de clientes */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <AlertCircle className="text-red-500" size={18} />
              Clientes ({filteredCustomers.length})
            </h3>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setActiveFilter('active'); setSelectedCustomer(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeFilter === 'active' ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-600 border-slate-200 hover:border-green-300'}`}
              >
                <UserCheck size={12} />
                Ativos
              </button>
              <button
                onClick={() => { setActiveFilter('inactive'); setSelectedCustomer(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${activeFilter === 'inactive' ? 'bg-slate-500 text-white border-slate-500' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
              >
                <UserX size={12} />
                Inativos
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 overflow-hidden max-h-[500px] overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">Nenhum cliente encontrado.</div>
            ) : (
              filteredCustomers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className={`w-full p-4 text-left transition-colors hover:bg-slate-50 ${selectedCustomer?.id === customer.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                >
                  {(() => {
                    const vehicle = vehicles.find(v => v.current_renter_id === customer.id);
                    return (
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{customer.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className={`text-xs font-medium ${customer.active_contract ? 'text-green-600' : 'text-slate-400'}`}>
                              {customer.active_contract ? 'Ativo' : 'Inativo'}
                            </span>
                            {vehicle && (
                              <span className="text-xs text-slate-500 truncate"> · {vehicle.plate}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Editor de mensagem */}
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
                  <p>Selecione um cliente ao lado para compor a mensagem.</p>
                </div>
              ) : (
                <div className="space-y-4 w-full">
                  {/* Select tipo de mensagem */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Tipo de Mensagem</label>
                    <div className="relative">
                      <select
                        value={messageType}
                        onChange={e => setMessageType(e.target.value as MessageTypeKey)}
                        className="w-full appearance-none p-3 pr-10 border border-slate-300 rounded-lg text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                      >
                        {(Object.entries(MESSAGE_TEMPLATES) as [MessageTypeKey, MessageTemplate][]).map(([key, tpl]) => (
                          <option key={key} value={key}>{tpl.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Textarea editável */}
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Mensagem</label>
                    <textarea
                      value={editedMessage}
                      onChange={e => setEditedMessage(e.target.value)}
                      rows={8}
                      className="w-full p-4 border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-slate-50 text-sm leading-relaxed"
                    />
                  </div>

                  <button
                    onClick={sendWhatsApp}
                    disabled={!editedMessage}
                    className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-50 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Enviar via WhatsApp
                  </button>
                  <p className="text-xs text-center text-slate-400">
                    Abrirá o WhatsApp Web ou Mobile com a mensagem pré-preenchida.
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
