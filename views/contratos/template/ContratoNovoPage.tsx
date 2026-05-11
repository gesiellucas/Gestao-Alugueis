'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { localRentalsApi } from '../../../database/api/local/rentals';
import { formatCPF } from '../../../lib/formatters';

type Step = 'selecionar-template' | 'selecionar-cliente' | 'preencher-formulario';

function resolveSource(source: string | undefined, customer: Customer | null, vehicle: Vehicle | null): string {
  if (!source) return '';
  if (source === 'customer.name') return customer?.name ?? '';
  if (source === 'customer.cpf') return formatCPF(customer?.cpf ?? '');
  if (source === 'customer.phone') return customer?.phone ?? '';
  if (source === 'customer.email') return customer?.email ?? '';
  if (source === 'customer.cnh') return customer?.cnh ?? '';
  if (source === 'customer.cnh_category') return customer?.cnh_category ?? '';
  if (source === 'customer.address') return customer?.address ?? '';
  if (source === 'customer.neighborhood') return customer?.neighborhood ?? '';
  if (source === 'customer.city') return customer?.city ?? '';
  if (source === 'customer.cityState') {
    const city = customer?.city ?? '';
    const state = customer?.state ?? '';
    if (city && state) return `${city}-${state}`;
    return city || state;
  }
  if (source === 'customer.addressFull') {
    const city = customer?.city ?? '';
    const state = customer?.state ?? '';
    const cityState = city && state ? `${city}-${state}` : (city || state);
    return [customer?.address, customer?.neighborhood, cityState].filter(Boolean).join(', ');
  }
  if (source === 'vehicle.plate') return vehicle?.plate ?? '';
  if (source === 'vehicle.chassi') return vehicle?.chassi ?? '';
  if (source === 'vehicle.model') return vehicle?.model?.name ?? '';
  if (source === 'vehicle.brand') return vehicle?.model?.brand ?? '';
  if (source === 'vehicle.year') return vehicle?.year ? String(vehicle.year) : '';
  return '';
}

function ContratoNovoPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rentalIdParam = searchParams.get('rental_id');

  const { customers, vehicles, rentalContracts, setRentalContracts } = useAppContext();

  const [step, setStep] = useState<Step>('selecionar-template');
  const [selectedTemplate, setSelectedTemplate] = useState<ContratoTemplate | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedRental, setSelectedRental] = useState<RentalContract | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [preselected, setPreselected] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Pre-select rental/customer/vehicle when coming from rental detail
  useEffect(() => {
    if (!rentalIdParam || !rentalContracts.length) return;
    const rental = rentalContracts.find((r) => r.id === rentalIdParam) ?? null;
    if (!rental) return;
    const customer = customers.find((c) => c.id === rental.customer_id) ?? null;
    const vehicle = vehicles.find((v) => v.id === rental.vehicle_id) ?? null;
    setSelectedRental(rental);
    setSelectedCustomer(customer);
    setSelectedVehicle(vehicle);
    setPreselected(true);
  }, [rentalIdParam, rentalContracts, customers, vehicles]);

  // Fallback: if rental_id is in URL but not in context yet (race condition right after creation),
  // fetch directly from DB and add to context so the effect above can pick it up.
  useEffect(() => {
    if (!rentalIdParam) return;
    if (rentalContracts.some((r) => r.id === rentalIdParam)) return;
    localRentalsApi.getById(rentalIdParam)
      .then((r) => {
        if (!r) return;
        setRentalContracts((prev) => {
          if (prev.some((c) => c.id === r.id)) return prev;
          return [r, ...prev];
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalIdParam]); // intentionally omit rentalContracts to avoid re-fetching after we add it

  const activeCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.cpf ?? '').includes(customerSearch),
  );

  // When selecting a customer manually, find active rental and vehicle
  useEffect(() => {
    if (preselected || !selectedCustomer) return;
    const rental = rentalContracts.find(
      (r) => r.customer_id === selectedCustomer.id && r.status === 'ACTIVE',
    ) ?? null;
    setSelectedRental(rental);
    const vehicle = rental
      ? vehicles.find((v) => v.id === rental.vehicle_id) ?? null
      : vehicles.find((v) => v.current_renter_id === selectedCustomer.id) ?? null;
    setSelectedVehicle(vehicle);
  }, [selectedCustomer, rentalContracts, vehicles, preselected]);

  // Pre-fill form fields with source values when entering the form step
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
    // If customer is pre-selected from rental, skip the customer selection step
    if (preselected && selectedCustomer) {
      setStep('preencher-formulario');
    } else {
      setStep('selecionar-cliente');
    }
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
      const buffer = await fetchTemplateBuffer(selectedTemplate.templateFile);
      const allData = { ...buildDateFields(), ...formData };
      const docxBlob = fillDocxTemplate(buffer, allData);

      const contract = await supabaseContractsApi.create({
        rental_id: selectedRental.id,
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        form_data: allData,
        status: 'ativo',
      });

      await supabaseContractDocumentsApi.uploadDocx(
        selectedRental.id,
        contract.id,
        docxBlob,
        selectedTemplate.name,
      );

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

  const stepLabels: Record<Step, string> = {
    'selecionar-template': 'Escolher Template',
    'selecionar-cliente': 'Selecionar Cliente',
    'preencher-formulario': 'Preencher Dados',
  };
  const allSteps: Step[] = ['selecionar-template', 'selecionar-cliente', 'preencher-formulario'];
  // When pre-selected, we show only 2 steps in the stepper
  const visibleSteps: Step[] = preselected
    ? ['selecionar-template', 'preencher-formulario']
    : allSteps;

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
        {visibleSteps.map((s, i) => {
          const current = step === s;
          const doneIdx = visibleSteps.indexOf(step);
          const done = doneIdx > i;
          return (
            <React.Fragment key={s}>
              {i > 0 && <ChevronRight size={16} className="text-slate-300" />}
              <span className={`flex items-center gap-1.5 ${current ? 'text-blue-600' : done ? 'text-green-600' : 'text-slate-400'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${current ? 'bg-blue-600' : done ? 'bg-green-500' : 'bg-slate-200'}`}>
                  {i + 1}
                </span>
                {stepLabels[s]}
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

      {/* ── Step 2: Customer Selector (skipped when pre-selected) ─────────── */}
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
        !selectedRental ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <AlertCircle size={28} className="text-amber-400" />
            </div>
            <div>
              <p className="font-bold text-slate-800">{selectedCustomer?.name} não possui aluguel ativo</p>
              <p className="text-slate-400 text-sm mt-1">Selecione um cliente com aluguel ativo para gerar o contrato.</p>
            </div>
            <button
              onClick={() => setStep('selecionar-cliente')}
              className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft size={16} />
              Trocar cliente
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <button
                onClick={() => setStep(preselected ? 'selecionar-template' : 'selecionar-cliente')}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-semibold transition-colors mb-4"
              >
                <ArrowLeft size={16} />
                {preselected ? 'Trocar template' : 'Trocar cliente'}
              </button>

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
                      <p className="text-sm font-bold text-green-800">
                        {selectedVehicle.plate}
                        {selectedVehicle.model && ` — ${selectedVehicle.model.brand} ${selectedVehicle.model.name}`}
                      </p>
                    </div>
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

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <Link
                href="/contratos"
                className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </Link>
              <button
                onClick={handleGenerate}
                disabled={submitting}
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
        )
      )}
    </div>
  );
}

export const ContratoNovoPage: React.FC = () => (
  <Suspense>
    <ContratoNovoPageInner />
  </Suspense>
);
