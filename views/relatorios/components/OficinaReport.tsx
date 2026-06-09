'use client';
import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ReportFilters, FilterSelect, type DateRange } from './ReportFilters';
import { ExportBar } from './ExportBar';
import { exportReport, type ExportFormat } from '@/lib/exportReport';
import { printReport } from '@/lib/printReport';
import { formatDateTime } from '@/lib/formatters';

export const OficinaReport: React.FC = () => {
  const { maintenanceRecords, vehicles, workshops } = useAppContext();

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [dateRange, setDateRange] = useState<DateRange>({ start: thirtyDaysAgo, end: today });
  const [statusFilter, setStatusFilter] = useState('');
  const [sortByCost, setSortByCost] = useState('');
  const [mechanicFilter, setMechanicFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [workshopFilter, setWorkshopFilter] = useState('');

  const mechanics = useMemo(() => {
    const set = new Set(maintenanceRecords.map((m) => m.mechanic_name).filter(Boolean));
    return Array.from(set).sort();
  }, [maintenanceRecords]);

  const filtered = useMemo(() => {
    let data = maintenanceRecords.filter((m) => {
      const entryDate = m.entry_date?.slice(0, 10);
      if (dateRange.start && entryDate < dateRange.start) return false;
      if (dateRange.end && entryDate > dateRange.end) return false;
      if (statusFilter && m.status !== statusFilter) return false;
      if (mechanicFilter && m.mechanic_name !== mechanicFilter) return false;
      if (vehicleFilter && m.vehicle_id !== vehicleFilter) return false;
      if (workshopFilter && m.workshop_id !== workshopFilter) return false;
      return true;
    });

    if (sortByCost === 'asc') data = [...data].sort((a, b) => a.cost - b.cost);
    if (sortByCost === 'desc') data = [...data].sort((a, b) => b.cost - a.cost);

    return data;
  }, [maintenanceRecords, dateRange, statusFilter, sortByCost, mechanicFilter, vehicleFilter, workshopFilter]);

  const getVehiclePlate = (vehicleId: string) => {
    return vehicles.find((v) => v.id === vehicleId)?.plate || vehicleId;
  };

  const getWorkshopName = (workshopId?: string | null) => {
    if (!workshopId) return '—';
    return workshops.find((w) => w.id === workshopId)?.name || workshopId;
  };

  const handleExport = (format: ExportFormat) => {
    const columns: { key: string; label: string }[] = [
      { key: 'vehicle_plate', label: 'Placa' },
      { key: 'workshop_name', label: 'Oficina' },
      { key: 'mechanic_name', label: 'Mecânico' },
      { key: 'type', label: 'Tipo' },
      { key: 'description', label: 'Descrição' },
      { key: 'entry_date_fmt', label: 'Data Entrada' },
      { key: 'completion_date_fmt', label: 'Data Conclusão' },
      { key: 'cost_fmt', label: 'Custo (R$)' },
      { key: 'status_label', label: 'Status' },
    ];

    const rows = filtered.map((m) => ({
      vehicle_plate: getVehiclePlate(m.vehicle_id),
      workshop_name: getWorkshopName(m.workshop_id),
      mechanic_name: m.mechanic_name,
      type: m.type,
      description: m.description,
      entry_date_fmt: formatDateTime(m.entry_date),
      completion_date_fmt: m.completion_date ? formatDateTime(m.completion_date) : '—',
      cost_fmt: m.cost.toFixed(2),
      status_label: m.status === 'OPEN' ? 'Aberto' : 'Concluído',
    }));

    exportReport(rows, columns as { key: keyof (typeof rows)[0]; label: string }[], {
      fileName: `relatorio-oficina-${dateRange.start}_${dateRange.end}`,
      sheetName: 'Oficina',
      format,
    });
  };

  const handlePrint = () => {
    const columns = [
      { label: 'Placa' }, { label: 'Oficina' }, { label: 'Mecânico' }, { label: 'Tipo' },
      { label: 'Entrada' }, { label: 'Conclusão' }, { label: 'Custo (R$)' }, { label: 'Status' },
      { label: 'Observações' },
    ];
    const rows = filtered.map((m) => [
      getVehiclePlate(m.vehicle_id), getWorkshopName(m.workshop_id), m.mechanic_name, m.type,
      formatDateTime(m.entry_date), m.completion_date ? formatDateTime(m.completion_date) : '—',
      m.cost.toFixed(2), m.status === 'OPEN' ? 'Aberto' : 'Concluído',
      m.description || '—',
    ]);
    printReport({ title: 'Relatório de Oficina', subtitle: `Período: ${dateRange.start} a ${dateRange.end}`, columns, rows });
  };

  return (
    <div className="space-y-5">
      <ReportFilters dateRange={dateRange} onDateRangeChange={setDateRange}>
        <FilterSelect
          label="Veículo"
          value={vehicleFilter}
          onChange={setVehicleFilter}
          options={vehicles.map((v) => ({ value: v.id, label: `${v.plate} — ${v.model?.name || ''}` }))}
          placeholder="Todos os veículos"
        />
        <FilterSelect
          label="Oficina"
          value={workshopFilter}
          onChange={setWorkshopFilter}
          options={workshops.map((w) => ({ value: w.id, label: w.name }))}
          placeholder="Todas as oficinas"
        />
        <FilterSelect
          label="Status do Serviço"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'OPEN', label: 'Aberto' },
            { value: 'COMPLETED', label: 'Concluído' },
          ]}
        />
        <FilterSelect
          label="Ordenar por Custo"
          value={sortByCost}
          onChange={setSortByCost}
          options={[
            { value: 'asc', label: 'Menor → Maior' },
            { value: 'desc', label: 'Maior → Menor' },
          ]}
          placeholder="Sem ordenação"
        />
        <FilterSelect
          label="Mecânico"
          value={mechanicFilter}
          onChange={setMechanicFilter}
          options={mechanics.map((m) => ({ value: m, label: m }))}
        />
      </ReportFilters>

      <ExportBar totalRecords={filtered.length} onExport={handleExport} onPrint={handlePrint} />

      {/* Preview Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#004AAD] text-white">
              <tr className="[&>th]:text-left [&>th]:px-5 [&>th]:py-3.5 [&>th]:font-bold [&>th]:text-xs [&>th]:uppercase [&>th]:tracking-wider">
                <th>Placa</th>
                <th>Oficina</th>
                <th>Mecânico</th>
                <th>Tipo</th>
                <th>Entrada</th>
                <th>Conclusão</th>
                <th>Custo</th>
                <th>Status</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Nenhum registro encontrado para o período selecionado.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 50).map((m) => (
                  <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-bold text-slate-700">{getVehiclePlate(m.vehicle_id)}</td>
                    <td className="px-5 py-3 text-slate-600">{getWorkshopName(m.workshop_id)}</td>
                    <td className="px-5 py-3 text-slate-600">{m.mechanic_name}</td>
                    <td className="px-5 py-3 text-slate-600">{m.type}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDateTime(m.entry_date)}</td>
                    <td className="px-5 py-3 text-slate-600">{m.completion_date ? formatDateTime(m.completion_date) : '—'}</td>
                    <td className="px-5 py-3 font-bold text-slate-700">R$ {m.cost.toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${m.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {m.status === 'OPEN' ? 'Aberto' : 'Concluído'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500 max-w-xs truncate" title={m.description || ''}>
                      {m.description || '—'}
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
