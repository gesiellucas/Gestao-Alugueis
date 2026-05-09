'use client';
import React, { useState } from 'react';
import { CheckCircle, FileText, Printer, X } from 'lucide-react';
import { Document, MaintenanceRecord, Vehicle, Workshop, Customer, RentalContract } from '../../../types';
import { formatCPF, formatPhone } from '../../../lib/formatters';
import { useFinanceAccess } from '../../../hooks/useFinanceAccess';
import { supabaseWorkshopDocumentsApi } from '../../../database/api/supabase/workshopDocuments';
import { localMaintenanceApi } from '../../../database/api/local/maintenance';

interface Props {
  record: MaintenanceRecord;
  vehicle: Vehicle;
  workshop: Workshop | undefined;
  customer: Customer | null;
  rentalContract: RentalContract | null;
  onClose: () => void;
  onSaved?: (doc: Document) => void;
}

export const OrdemServicoModal: React.FC<Props> = ({
  record,
  vehicle,
  workshop,
  customer,
  rentalContract,
  onClose,
  onSaved,
}) => {
  const hasFinanceAccess = useFinanceAccess();

  const [mechanic, setMechanic] = useState(record.mechanic_name || '');
  const [entryDate, setEntryDate] = useState(
    record.entry_date ? record.entry_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
  );
  const [cost, setCost] = useState(String(record.cost ?? 0));
  const [observations, setObservations] = useState(record.description || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!record.service_order_url);

  const osNumber = record.id.slice(-8).toUpperCase();

  const buildOsHtml = (): string => {
    const issueDate = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const entryFormatted = entryDate
      ? new Date(entryDate).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        })
      : '—';
    const costFormatted =
      hasFinanceAccess && parseFloat(cost) > 0
        ? `R$ ${parseFloat(cost).toFixed(2).replace('.', ',')}`
        : null;
    const badgeBg   = record.status === 'OPEN' ? '#fef3c7' : '#dcfce7';
    const badgeClr  = record.status === 'OPEN' ? '#92400e' : '#166534';
    const badgeBdr  = record.status === 'OPEN' ? '#fde68a' : '#bbf7d0';
    const badgeTxt  = record.status === 'OPEN' ? 'Em manutenção' : 'Concluída';

    const customerRows = customer
      ? `<tr><td class="lb">Nome</td><td class="vl">${customer.name}</td></tr>
         <tr><td class="lb">CPF</td><td class="vl">${formatCPF(customer.cpf)}</td></tr>
         <tr><td class="lb">Telefone</td><td class="vl">${formatPhone(customer.phone)}</td></tr>
         ${rentalContract ? `<tr><td class="lb">Contrato desde</td><td class="vl">${new Date(rentalContract.start_date).toLocaleDateString('pt-BR')}</td></tr>` : ''}`
      : '';
    const completionRow = record.status === 'COMPLETED' && record.completion_date
      ? `<tr><td class="lb">Conclusão</td><td class="vl">${new Date(record.completion_date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>`
      : '';
    const costRow = costFormatted
      ? `<tr><td class="lb">Custo estimado</td><td class="vl cost">${costFormatted}</td></tr>`
      : '';
    const workshopRow = workshop
      ? `<tr><td class="lb">Oficina</td><td class="vl">${workshop.name}${workshop.address ? ` — ${workshop.address}` : ''}</td></tr>`
      : '';

    return `
      <div style="font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;max-width:720px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e40af;padding-bottom:12px;margin-bottom:16px;">
          <div>
            <div style="font-size:20px;font-weight:900;color:#1e40af;">GC Loca Moto</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">Gestão de Locação de Motocicletas</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:16px;font-weight:900;color:#1e40af;text-transform:uppercase;letter-spacing:1px;">Ordem de Serviço</div>
            <div style="font-size:13px;font-weight:bold;color:#374151;margin-top:4px;">Nº OS-${osNumber}</div>
            <div style="font-size:11px;color:#6b7280;margin-top:2px;">Emitida em ${issueDate}</div>
          </div>
        </div>

        <div style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:12px;">
          <div style="background:#1e40af;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:6px 12px;">Veículo</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #f1f5f9;"><td class="lb">Placa</td><td class="vl" style="font-family:monospace;">${vehicle.plate}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td class="lb">Modelo</td><td class="vl">${vehicle.model?.name || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td class="lb">Marca</td><td class="vl">${vehicle.model?.brand || '—'}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td class="lb">Ano</td><td class="vl">${vehicle.year || '—'}</td></tr>
            ${vehicle.mileage ? `<tr style="border-bottom:1px solid #f1f5f9;"><td class="lb">Quilometragem</td><td class="vl">${vehicle.mileage.toLocaleString('pt-BR')} km</td></tr>` : ''}
            <tr><td class="lb">Status</td><td class="vl"><span style="background:${badgeBg};color:${badgeClr};border:1px solid ${badgeBdr};font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:4px;">${badgeTxt}</span></td></tr>
          </table>
        </div>

        ${customer ? `
        <div style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:12px;">
          <div style="background:#1e40af;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:6px 12px;">Cliente (Locatário)</div>
          <table style="width:100%;border-collapse:collapse;">${customerRows}</table>
        </div>` : ''}

        <div style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:12px;">
          <div style="background:#1e40af;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:6px 12px;">Serviço</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #f1f5f9;"><td class="lb">Tipo</td><td class="vl">${record.type}</td></tr>
            <tr style="border-bottom:1px solid #f1f5f9;"><td class="lb">Mecânico responsável</td><td class="vl">${mechanic || '—'}</td></tr>
            ${workshopRow}
            <tr style="border-bottom:1px solid #f1f5f9;"><td class="lb">Data / Hora de entrada</td><td class="vl">${entryFormatted}</td></tr>
            ${completionRow}
            ${costRow}
          </table>
        </div>

        <div style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:12px;">
          <div style="background:#1e40af;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:6px 12px;">Observações / Descrição dos Serviços</div>
          <div style="padding:10px 12px;min-height:64px;font-size:12px;color:#374151;line-height:1.6;white-space:pre-wrap;">${observations || 'Nenhuma observação registrada.'}</div>
        </div>

        <div style="display:flex;gap:24px;margin-top:40px;">
          <div style="flex:1;text-align:center;"><div style="border-top:1px solid #94a3b8;margin-top:48px;padding-top:6px;font-size:10px;color:#64748b;">Responsável técnico / Mecânico</div></div>
          <div style="flex:1;text-align:center;"><div style="border-top:1px solid #94a3b8;margin-top:48px;padding-top:6px;font-size:10px;color:#64748b;">Cliente / Locatário</div></div>
          <div style="flex:1;text-align:center;"><div style="border-top:1px solid #94a3b8;margin-top:48px;padding-top:6px;font-size:10px;color:#64748b;">Gerente / Aprovação</div></div>
        </div>

        <div style="text-align:center;margin-top:24px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:10px;">
          GC Loca Moto · OS-${osNumber} · Documento gerado em ${issueDate}
        </div>
      </div>
    `;
  };

  const generateDocumentBlob = async (): Promise<Blob> => {
    const styleId = 'os-pdf-gen-style';
    const containerId = 'os-pdf-gen-container';

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      #${containerId} .lb { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;width:35%;padding:7px 12px; }
      #${containerId} .vl { font-size:12px;font-weight:600;color:#1e293b;padding:7px 12px; }
      #${containerId} .cost { font-size:14px;font-weight:900;color:#15803d; }
    `;
    document.head.appendChild(styleEl);

    const container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = 'position:absolute;left:-9999px;top:0;width:794px;background:white;padding:20px 24px;box-sizing:border-box;';
    container.innerHTML = buildOsHtml();
    document.body.appendChild(container);

    try {
      const { default: html2canvas } = await import('html2canvas');

      const canvas = await html2canvas(container, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem da OS'))),
          'image/jpeg',
          0.95,
        );
      });
    } finally {
      document.getElementById(styleId)?.remove();
      document.getElementById(containerId)?.remove();
    }
  };

  const handleSaveOS = async () => {
    setSaving(true);
    try {
      const pdfBlob = await generateDocumentBlob();
      const doc = await supabaseWorkshopDocumentsApi.uploadServiceOrderPdf(record.id, pdfBlob, osNumber);
      await localMaintenanceApi.update(record.id, { service_order_url: doc.file_url });
      setSaved(true);
      onSaved?.(doc);
    } catch (err) {
      console.error('Erro ao salvar OS:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const styleId = 'os-print-style';
    const divId = 'os-print-content';

    document.getElementById(styleId)?.remove();
    document.getElementById(divId)?.remove();

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #${divId} .lb { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b;width:35%;padding:7px 12px; }
      #${divId} .vl { font-size:12px;font-weight:600;color:#1e293b;padding:7px 12px; }
      #${divId} .cost { font-size:14px;font-weight:900;color:#15803d; }
      @media screen { #${divId} { display: none !important; } }
      @media print {
        @page { margin: 15mm; size: portrait; }
        body > *:not(#${divId}) { display: none !important; }
        html, body { height: auto !important; overflow: visible !important; }
        #${divId} { display: block !important; position: static !important; width: 100% !important; background: #fff !important; margin: 0 !important; padding: 0 !important; }
      }
    `;

    const div = document.createElement('div');
    div.id = divId;
    div.innerHTML = buildOsHtml();

    document.head.appendChild(style);
    document.body.appendChild(div);

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.getElementById(styleId)?.remove();
        document.getElementById(divId)?.remove();
      }, 1000);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <FileText size={18} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm">Ordem de Serviço</p>
            <p className="text-xs text-slate-400 font-mono">OS-{osNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Vehicle summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Veículo</p>
            <p className="font-bold text-slate-800 text-sm">{vehicle.model?.name || '—'} <span className="text-slate-400 font-normal">·</span> {vehicle.model?.brand || '—'}</p>
            <p className="font-mono text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-md px-2 py-0.5 inline-block">{vehicle.plate}</p>
            {vehicle.mileage > 0 && (
              <p className="text-xs text-slate-500">{vehicle.mileage.toLocaleString('pt-BR')} km</p>
            )}
          </div>

          {/* Customer summary */}
          {customer && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-1 border border-blue-100">
              <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">Locatário</p>
              <p className="font-bold text-slate-800 text-sm">{customer.name}</p>
              <p className="text-xs text-slate-500">{formatCPF(customer.cpf)} · {formatPhone(customer.phone)}</p>
            </div>
          )}

          {/* Editable fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Mecânico responsável
              </label>
              <input
                type="text"
                value={mechanic}
                onChange={(e) => setMechanic(e.target.value)}
                placeholder="Nome do mecânico"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Data / Hora de entrada
              </label>
              <input
                type="datetime-local"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
              />
            </div>

            {hasFinanceAccess && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Custo (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Observações / Descrição dos serviços
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={4}
                placeholder="Descreva os serviços realizados..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 resize-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="py-2.5 px-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 text-sm"
          >
            Fechar
          </button>
          <button
            onClick={handleSaveOS}
            disabled={saving}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-colors"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle size={15} />
            ) : (
              <span className="text-base leading-none">☁</span>
            )}
            {saving ? 'Gerando PDF...' : saved ? 'PDF Salvo' : 'Salvar PDF'}
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors"
          >
            <Printer size={15} />
            Imprimir OS
          </button>
        </div>
      </div>
    </div>
  );
};
