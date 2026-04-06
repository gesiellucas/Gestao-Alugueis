'use client';
import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ReportFilters, FilterSelect, type DateRange } from './ReportFilters';
import { ExportBar } from './ExportBar';
import { exportReport, type ExportFormat } from '@/lib/exportReport';
import { printReport } from '@/lib/printReport';

export const VeiculosReport: React.FC = () => {
  const { vehicles, vehicleStatuses, rentalContracts, vehicleStatusIds } = useAppContext();

  const today = new Date().toISOString().slice(0, 10);
  const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);

  const [dateRange, setDateRange] = useState<DateRange>({ start: oneYearAgo, end: today });
  const [statusFilter, setStatusFilter] = useState('');
  const [mileageControl, setMileageControl] = useState('');

  // Calculate accumulated mileage from rentals in the period
  const mileageByVehicle = useMemo(() => {
    const map: Record<string, { rentalCount: number; totalMonths: number }> = {};
    rentalContracts.forEach((r) => {
      const startDate = r.start_date?.slice(0, 10);
      if (dateRange.start && startDate < dateRange.start) return;
      if (dateRange.end && startDate > dateRange.end) return;

      if (!map[r.vehicle_id]) map[r.vehicle_id] = { rentalCount: 0, totalMonths: 0 };
      map[r.vehicle_id].rentalCount += 1;

      const start = new Date(r.start_date);
      const end = r.end_date ? new Date(r.end_date) : new Date();
      const months = Math.max(1, Math.round((end.getTime() - start.getTime()) / (30 * 86400000)));
      map[r.vehicle_id].totalMonths += months;
    });
    return map;
  }, [rentalContracts, dateRange]);

  const filtered = useMemo(() => {
    let data = vehicles.filter((v) => {
      if (statusFilter && v.status_id !== statusFilter) return false;
      return true;
    });

    if (mileageControl === 'high') {
      data = [...data].sort((a, b) => b.mileage - a.mileage);
    } else if (mileageControl === 'low') {
      data = [...data].sort((a, b) => a.mileage - b.mileage);
    }

    return data;
  }, [vehicles, statusFilter, mileageControl]);

  const getStatusName = (statusId: string) => {
    return vehicleStatuses.find((s) => s.id === statusId)?.name || '—';
  };

  const getStatusColor = (statusId: string) => {
    switch (statusId) {
      case vehicleStatusIds.AVAILABLE: return 'bg-green-100 text-green-700';
      case vehicleStatusIds.RENTED: return 'bg-blue-100 text-blue-700';
      case vehicleStatusIds.MAINTENANCE: return 'bg-amber-100 text-amber-700';
      case vehicleStatusIds.UNAVAILABLE: return 'bg-red-100 text-red-700';
      case vehicleStatusIds.STOLEN: return 'bg-purple-100 text-purple-700';
      case vehicleStatusIds.TOTALED: return 'bg-gray-100 text-gray-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const handleExport = (format: ExportFormat) => {
    const columns: { key: string; label: string }[] = [
      { key: 'plate', label: 'Placa' },
      { key: 'model_name', label: 'Modelo' },
      { key: 'brand', label: 'Marca' },
      { key: 'year', label: 'Ano' },
      { key: 'status_name', label: 'Status' },
      { key: 'mileage_fmt', label: 'Quilometragem Atual' },
      { key: 'rental_count', label: 'Aluguéis no Período' },
      { key: 'rental_months', label: 'Meses Alugado' },
      { key: 'monthly_rate_fmt', label: 'Valor Mensal (R$)' },
    ];

    const rows = filtered.map((v) => {
      const usage = mileageByVehicle[v.id];
      return {
        plate: v.plate,
        model_name: v.model?.name || '—',
        brand: v.model?.brand || '—',
        year: String(v.year),
        status_name: getStatusName(v.status_id),
        mileage_fmt: v.mileage.toLocaleString('pt-BR') + ' km',
        rental_count: String(usage?.rentalCount || 0),
        rental_months: String(usage?.totalMonths || 0),
        monthly_rate_fmt: v.default_monthly_rate.toFixed(2),
      };
    });

    exportReport(rows, columns as { key: keyof (typeof rows)[0]; label: string }[], {
      fileName: `relatorio-veiculos-${dateRange.start}_${dateRange.end}`,
      sheetName: 'Veículos',
      format,
    });
  };

  const handlePrint = () => {
    const columns = [
      { label: 'Placa' }, { label: 'Modelo' }, { label: 'Marca' }, { label: 'Ano' },
      { label: 'Status' }, { label: 'Quilometragem' }, { label: 'Aluguéis' }, { label: 'Meses Alugado' }, { label: 'Valor Mensal (R$)' },
    ];
    const rows = filtered.map((v) => {
      const usage = mileageByVehicle[v.id];
      return [
        v.plate, v.model?.name || '—', v.model?.brand || '—', String(v.year),
        getStatusName(v.status_id), v.mileage.toLocaleString('pt-BR') + ' km',
        String(usage?.rentalCount || 0), String(usage?.totalMonths || 0), v.default_monthly_rate.toFixed(2),
      ];
    });
    printReport({ title: 'Relatório de Veículos', subtitle: `Período: ${dateRange.start} a ${dateRange.end}`, columns, rows });
  };

  const statusOptions = vehicleStatuses.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div className="space-y-5">
      <ReportFilters dateRange={dateRange} onDateRangeChange={setDateRange}>
        <FilterSelect
          label="Status do Veículo"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
        />
        <FilterSelect
          label="Controle de Quilometragem"
          value={mileageControl}
          onChange={setMileageControl}
          options={[
            { value: 'high', label: 'Maior → Menor' },
            { value: 'low', label: 'Menor → Maior' },
          ]}
          placeholder="Sem ordenação"
        />
      </ReportFilters>

      <ExportBar totalRecords={filtered.length} onExport={handleExport} onPrint={handlePrint} />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#004AAD] text-white">
              <tr className="[&>th]:text-left [&>th]:px-5 [&>th]:py-3.5 [&>th]:font-bold [&>th]:text-xs [&>th]:uppercase [&>th]:tracking-wider">
                <th>Placa</th>
                <th>Modelo</th>
                <th>Ano</th>
                <th>Status</th>
                <th>Quilometragem</th>
                <th>Aluguéis</th>
                <th>Meses Alugado</th>
                <th>Valor Mensal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Nenhum veículo encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 50).map((v) => {
                  const usage = mileageByVehicle[v.id];
                  return (
                    <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-bold text-slate-700">{v.plate}</td>
                      <td className="px-5 py-3 text-slate-600">{v.model?.name || '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{v.year}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusColor(v.status_id)}`}>
                          {getStatusName(v.status_id)}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-700">{v.mileage.toLocaleString('pt-BR')} km</td>
                      <td className="px-5 py-3 text-slate-600">{usage?.rentalCount || 0}</td>
                      <td className="px-5 py-3 text-slate-600">{usage?.totalMonths || 0}</td>
                      <td className="px-5 py-3 font-bold text-slate-700">R$ {v.default_monthly_rate.toFixed(2)}</td>
                    </tr>
                  );
                })
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
