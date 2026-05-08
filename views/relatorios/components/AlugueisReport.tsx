'use client';
import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ReportFilters, FilterSelect, type DateRange } from './ReportFilters';
import { ExportBar } from './ExportBar';
import { exportReport, type ExportFormat } from '@/lib/exportReport';
import { printReport } from '@/lib/printReport';
import { formatDate } from '@/lib/formatters';

export const AlugueisReport: React.FC = () => {
  const { rentalContracts, vehicles, customers } = useAppContext();

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [dateRange, setDateRange] = useState<DateRange>({ start: thirtyDaysAgo, end: today });
  const [statusFilter, setStatusFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  const filtered = useMemo(() => {
    return rentalContracts.filter((r) => {
      const startDate = r.start_date?.slice(0, 10);
      if (dateRange.start && startDate < dateRange.start) return false;
      if (dateRange.end && startDate > dateRange.end) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (vehicleFilter && r.vehicle_id !== vehicleFilter) return false;
      if (customerFilter && r.customer_id !== customerFilter) return false;
      return true;
    });
  }, [rentalContracts, dateRange, statusFilter, vehicleFilter, customerFilter]);

  const getVehiclePlate = (vehicleId: string) => {
    return vehicles.find((v) => v.id === vehicleId)?.plate || vehicleId;
  };

  const getVehicleModel = (vehicleId: string) => {
    const v = vehicles.find((v) => v.id === vehicleId);
    return v?.model?.name || '—';
  };

  const getCustomerName = (customerId: string) => {
    return customers.find((c) => c.id === customerId)?.name || customerId;
  };

  const handleExport = (format: ExportFormat) => {
    const columns: { key: string; label: string }[] = [
      { key: 'customer_name', label: 'Cliente' },
      { key: 'vehicle_plate', label: 'Placa' },
      { key: 'vehicle_model', label: 'Modelo' },
      { key: 'start_date_fmt', label: 'Data Início' },
      { key: 'end_date_fmt', label: 'Data Fim' },
      { key: 'monthly_rate_fmt', label: 'Valor Mensal (R$)' },
      { key: 'status_label', label: 'Status' },
    ];

    const rows = filtered.map((r) => ({
      customer_name: getCustomerName(r.customer_id),
      vehicle_plate: getVehiclePlate(r.vehicle_id),
      vehicle_model: getVehicleModel(r.vehicle_id),
      start_date_fmt: formatDate(r.start_date),
      end_date_fmt: r.end_date ? formatDate(r.end_date) : '—',
      monthly_rate_fmt: r.monthly_rate.toFixed(2),
      status_label: r.status === 'ACTIVE' ? 'Ativo' : 'Encerrado',
    }));

    exportReport(rows, columns as { key: keyof (typeof rows)[0]; label: string }[], {
      fileName: `relatorio-alugueis-${dateRange.start}_${dateRange.end}`,
      sheetName: 'Aluguéis',
      format,
    });
  };

  const handlePrint = () => {
    const columns = [
      { label: 'Cliente' }, { label: 'Placa' }, { label: 'Modelo' },
      { label: 'Início' }, { label: 'Fim' }, { label: 'Valor Mensal (R$)' }, { label: 'Status' },
    ];
    const rows = filtered.map((r) => [
      getCustomerName(r.customer_id), getVehiclePlate(r.vehicle_id), getVehicleModel(r.vehicle_id),
      formatDate(r.start_date), r.end_date ? formatDate(r.end_date) : '—',
      r.monthly_rate.toFixed(2), r.status === 'ACTIVE' ? 'Ativo' : 'Encerrado',
    ]);
    printReport({ title: 'Relatório de Aluguéis', subtitle: `Período: ${dateRange.start} a ${dateRange.end}`, columns, rows });
  };

  return (
    <div className="space-y-5">
      <ReportFilters dateRange={dateRange} onDateRangeChange={setDateRange}>
        <FilterSelect
          label="Status do Aluguel"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'ACTIVE', label: 'Ativo' },
            { value: 'ENDED', label: 'Encerrado' },
          ]}
        />
        <FilterSelect
          label="Veículo"
          value={vehicleFilter}
          onChange={setVehicleFilter}
          options={vehicles.map((v) => ({ value: v.id, label: `${v.plate} — ${v.model?.name || ''}` }))}
          placeholder="Todos os veículos"
        />
        <FilterSelect
          label="Cliente"
          value={customerFilter}
          onChange={setCustomerFilter}
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Todos os clientes"
        />
      </ReportFilters>

      <ExportBar totalRecords={filtered.length} onExport={handleExport} onPrint={handlePrint} />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#004AAD] text-white">
              <tr className="[&>th]:text-left [&>th]:px-5 [&>th]:py-3.5 [&>th]:font-bold [&>th]:text-xs [&>th]:uppercase [&>th]:tracking-wider">
                <th>Cliente</th>
                <th>Placa</th>
                <th>Modelo</th>
                <th>Início</th>
                <th>Fim</th>
                <th>Valor Mensal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Nenhum aluguel encontrado para o período selecionado.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 50).map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-bold text-slate-700">{getCustomerName(r.customer_id)}</td>
                    <td className="px-5 py-3 text-slate-600">{getVehiclePlate(r.vehicle_id)}</td>
                    <td className="px-5 py-3 text-slate-600">{getVehicleModel(r.vehicle_id)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(r.start_date)}</td>
                    <td className="px-5 py-3 text-slate-600">{r.end_date ? formatDate(r.end_date) : '—'}</td>
                    <td className="px-5 py-3 font-bold text-slate-700">R$ {r.monthly_rate.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${r.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {r.status === 'ACTIVE' ? 'Ativo' : 'Encerrado'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 50 && (
          <div className="px-5 py-3 bg-slate-50 text-xs text-slate-500 font-medium border-t border-slate-100">
            Exibindo 50 de {filtered.length} registros. Exporte o relatório para ver todos.
          </div>
        )}
      </div>
    </div>
  );
};
