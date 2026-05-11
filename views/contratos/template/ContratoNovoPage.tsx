'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, FileSignature, AlertCircle, User, Bike, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Customer, Vehicle, ContratoTemplate, RentalContract } from '../../../types';
import { useAppContext } from '../../../contexts/AppContext';
import { CONTRATOS_TEMPLATES } from '../templates';
import { ContratoFormField } from '../components/ContratoFormField';
import { fetchTemplateBuffer, fillDocxTemplate, downloadDocx, buildDateFields } from '../../../lib/docxTemplate';
import { supabaseContractsApi } from '../../../database/api/supabase/contracts';
import { supabaseContractDocumentsApi } from '../../../database/api/supabase/contractDocuments';
import { formatCPF } from '../../../lib/formatters';

type Step = 'selecionar-template' | 'selecionar-cliente' | 'preencher-formulario';

function resolveSource(source: string | undefined, customer: Customer | null, vehicle: Vehicle | null): string {
  if (!source) return '';
  if (source === 'customer.name') return customer?.name ?? '';
  if (source === 'customer.cpf') return formatCPF(customer?.cpf ?? '');
  if (source === 'customer.phone') return customer?.phone ?? '';
  if (source === 'vehicle.plate') return vehicle?.plate ?? '';
  return '';
}

export const ContratoNovoPage: React.FC = () => {
  const router = useRouter();
  const { customers, vehicles, rentalContracts } = useAppContext();

  const [step, setStep] = useState<Step>('selecionar-template');
  const [selectedTemplate, setSelectedTemplate] = useState<ContratoTemplate | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedRental, setSelectedRental] = useState<RentalContract | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [customerSearch, setCustomerSearch] = useState('');

  const activeCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.cpf ?? '').includes(customerSearch),
  );

  // Ao selecionar cliente, encontra o aluguel ativo e o veículo automaticamente
  useEffect(() => {
    if (!selectedCustomer) {
      setSelectedRental(null);
      setSelectedVehicle(null);
      return;
    }
    const rental = rentalContracts.find(
      (r) => r.customer_id === selectedCustomer.id && r.status === 'ACTIVE',
    ) ?? null;
    setSelectedRental(rental);

    const vehicle = rental
      ? vehicles.find((v) => v.id === rental.vehicle_id) ?? null
      : vehicles.find((v) => v.current_renter_id === selectedCustomer.id) ?? null;
    setSelectedVehicle(vehicle);
  }, [selectedCustomer, rentalContracts, vehicles]);

  // Pré-preenche campos com source ao avançar para o formulário
  useEffect(() => {
    if (!selectedTemplate || step !== 'preencher-formulario') return;
    const prefilled: Record<string, string> = { ...buildDateFields() };
    selectedTemplate.fields.forEach((f) => {
      if (f.source) {
        const val = resolveSource(f.source, selectedCustomer, selectedVehicle);
        if (val) prefilled[f.key] = val;
      }
    });
    setFormData((prev) => ({ ...prefilled, ...prev }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSelectTemplate = (template: ContratoTemplate) => {
    setSelectedTemplate(template);
    setFormData({});
    setErrors({});
    setStep('selecionar-cliente');
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({});
    setStep('preencher-formulario');
  };

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
  };

  const validate = (): boolean => {
    if (!selectedTemplate) return false;
    const newErrors: Record<string, string> = {};
    selectedTemplate.fields.forEach((field) => {
      if (field.required && !formData[field.key]?.trim()) {
        newErrors[field.key] = 'Campo obrigatório.';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate() || !selectedTemplate || !selectedRental) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      // 1. Preencher o DOCX template
      const buffer = await fetchTemplateBuffer(selectedTemplate.templateFile);
      const allData = { ...buildDateFields(), ...formData };
      const docxBlob = fillDocxTemplate(buffer, allData);

      // 2. Salvar contrato no banco
      const contract = await supabaseContractsApi.create({
        rental_id: selectedRental.id,
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        form_data: allData,
        status: 'ativo',
      });

      // 3. Upload do DOCX no storage
      await supabaseContractDocumentsApi.uploadDocx(
        selectedRental.id,
        contract.id,
        docxBlob,
        selectedTemplate.name,
      );

      // 4. Baixar DOCX para o usuário imediatamente
      const filename = `${selectedTemplate.name} - ${formData['nome_cliente'] ?? ''}.docx`;
      downloadDocx(docxBlob, filename);

      router.push(`/contratos/${contract.id}`);
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : (err as any)?.message ?? JSON.stringify(err);
      console.error('Contract generation error:', msg, err);
      setSubmitError(`Erro ao gerar contrato: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <ModuleHeader
        title="Novo Contrato"
        subtitle={
          step === 'selecionar-template' ? 'Escolha o template do contrato.' :
          step === 'selecionar-cliente' ? `Template: ${selectedTemplate?.name}` :
          `${selectedTemplate?.name} — ${selectedCustomer?.name}`
        }
        breadcrumbs={[
          { label: 'Contratos', href: '/contratos' },
          { label: 'Novo Contrato' },
        ]}
      />

      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm font-semibold flex-wrap">
        {(['selecionar-template', 'selecionar-cliente', 'preencher-formulario'] as Step[]).map((s, i) => {
          const labels = ['Escolher Template', 'Selecionar Cliente', 'Preencher Dados'];
          const current = step === s;
          const done = ['selecionar-template', 'selecionar-cliente', 'preencher-formulario'].indexOf(step) > i;
          return (
            <React.Fragment key={s}>
              {i > 0 && <ChevronRight size={16} className="text-slate-300" />}
              <span className={`flex items-center gap-1.5 ${current ? 'text-blue-600' : done ? 'text-green-600' : 'text-slate-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${current ? 'bg-blue-600' : done ? 'bg-green-500' : 'bg-slate-200'}`}>
                  {i + 1}
                </span>
                {labels[i]}
              </span>
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Step 1: Template Selector ─────────────────────────────────────── */}
      {step === 'selecionar-template' && (
        CONTRATOS_TEMPLATES.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center gap-4 text-center">
            <AlertCircle size={32} className="text-amber-400" />
            <div>
              <p className="font-bold text-slate-700">Nenhum template cadastrado</p>
              <p className="text-slate-400 text-sm mt-1">
                Adicione templates em{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">
                  views/contratos/templates/index.ts
                </code>
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONTRATOS_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 text-left hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 transition-all group active:scale-95"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <FileSignature size={20} className="text-blue-600" />
                </div>
                <p className="font-bold text-slate-800 text-sm">{template.name}</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{template.description}</p>
                <p className="text-blue-500 text-xs font-semibold mt-3">
                  {template.fields.filter((f) => !f.source).length} campos manuais
                </p>
              </button>
            ))}
          </div>
        )
      )}

      {/* ── Step 2: Customer Selector ─────────────────────────────────────── */}
      {step === 'selecionar-cliente' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <button
              onClick={() => setStep('selecionar-template')}
              className="text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="font-bold text-slate-800">Selecionar Cliente</p>
              <p className="text-slate-400 text-xs mt-0.5">O cliente deve ter um aluguel ativo.</p>
            </div>
          </div>
          <div className="p-4 border-b border-slate-100">
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400"
            />
          </div>
          <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
            {activeCustomers.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">Nenhum cliente encontrado.</div>
            ) : (
              activeCustomers.map((customer) => {
                const rental = rentalContracts.find(
                  (r) => r.customer_id === customer.id && r.status === 'ACTIVE',
                );
                const vehicle = rental
                  ? vehicles.find((v) => v.id === rental.vehicle_id)
                  : vehicles.find((v) => v.current_renter_id === customer.id);

                return (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{customer.name}</p>
                      <p className="text-xs text-slate-400">{formatCPF(customer.cpf ?? '')}</p>
                    </div>
                    {vehicle ? (
                      <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold bg-green-50 px-2.5 py-1 rounded-full">
                        <Bike size={12} />
                        {vehicle.plate}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300 font-medium">sem aluguel ativo</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Step 3: Form ──────────────────────────────────────────────────── */}
      {step === 'preencher-formulario' && selectedTemplate && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <button
              onClick={() => setStep('selecionar-cliente')}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors mb-4"
            >
              <ArrowLeft size={16} />
              Trocar cliente
            </button>

            {/* Resumo do cliente e veículo */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2.5 bg-blue-50 px-4 py-2.5 rounded-xl">
                <User size={16} className="text-blue-500" />
                <div>
                  <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Cliente</p>
                  <p className="text-sm font-bold text-blue-800">{selectedCustomer?.name}</p>
                </div>
              </div>
              {selectedVehicle && (
                <div className="flex items-center gap-2.5 bg-green-50 px-4 py-2.5 rounded-xl">
                  <Bike size={16} className="text-green-500" />
                  <div>
                    <p className="text-xs text-green-400 font-semibold uppercase tracking-wider">Veículo</p>
                    <p className="text-sm font-bold text-green-800">{selectedVehicle.plate}</p>
                  </div>
                </div>
              )}
              {!selectedRental && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl">
                  <AlertCircle size={16} className="text-amber-500" />
                  <p className="text-xs text-amber-700 font-semibold">Sem aluguel ativo — o contrato não será vinculado a um aluguel.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {selectedTemplate.fields.map((field) => (
              <ContratoFormField
                key={field.key}
                field={field}
                value={formData[field.key] ?? ''}
                onChange={(v) => handleFieldChange(field.key, v)}
                error={errors[field.key]}
                autoFilled={!!field.source && !!resolveSource(field.source, selectedCustomer, selectedVehicle)}
              />
            ))}
          </div>

          {submitError && (
            <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              {submitError}
            </div>
          )}

          {!selectedRental && (
            <div className="mx-6 mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 font-medium">
              Este cliente não possui aluguel ativo. Selecione um cliente com aluguel ativo para vincular o contrato.
            </div>
          )}

          <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/contratos"
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </Link>
            <button
              onClick={handleGenerate}
              disabled={submitting || !selectedRental}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FileSignature size={16} />
                  Gerar Contrato
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
