'use client';
import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { ReportFilters, FilterSelect, type DateRange } from './ReportFilters';
import { ExportBar } from './ExportBar';
import { exportReport, type ExportFormat } from '@/lib/exportReport';
import { printReport } from '@/lib/printReport';
import { formatCPF, formatPhone, formatDate } from '@/lib/formatters';

export const ClientesReport: React.FC = () => {
  const { customers, rentalContracts, vehicles } = useAppContext();

  const today = new Date().toISOString().slice(0, 10);
  const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);

  const [dateRange, setDateRange] = useState<DateRange>({ start: oneYearAgo, end: today });
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  // Vehicles rented by each customer in period
  const rentalsByCustomer = useMemo(() => {
    const map: Record<string, { vehiclePlates: string[]; count: number }> = {};
    rentalContracts.forEach((r) => {
      const startDate = r.start_date?.slice(0, 10);
      if (dateRange.start && startDate < dateRange.start) return;
      if (dateRange.end && startDate > dateRange.end) return;

      if (!map[r.customer_id]) map[r.customer_id] = { vehiclePlates: [], count: 0 };
      map[r.customer_id].count += 1;
      const plate = vehicles.find((v) => v.id === r.vehicle_id)?.plate;
      if (plate && !map[r.customer_id].vehiclePlates.includes(plate)) {
        map[r.customer_id].vehiclePlates.push(plate);
      }
    });
    return map;
  }, [rentalContracts, vehicles, dateRange]);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter === 'active' && !c.active_contract) return false;
      if (statusFilter === 'inactive' && c.active_contract) return false;
      if (statusFilter === 'debt' && c.balance_due <= 0) return false;
      if (customerFilter && c.id !== customerFilter) return false;
      return true;
    });
  }, [customers, statusFilter, customerFilter]);

  const handleExport = (format: ExportFormat) => {
    const columns: { key: string; label: string }[] = [
      { key: 'name', label: 'Nome' },
      { key: 'cpf_fmt', label: 'CPF' },
      { key: 'phone_fmt', label: 'Telefone' },
      { key: 'status_label', label: 'Status' },
      { key: 'balance_fmt', label: 'Saldo Devedor (R$)' },
      { key: 'last_payment_fmt', label: 'Último Pagamento' },
      { key: 'rentals_count', label: 'Aluguéis no Período' },
      { key: 'vehicles_rented', label: 'Veículos Alugados' },
    ];

    const rows = filtered.map((c) => {
      const rental = rentalsByCustomer[c.id];
      return {
        name: c.name,
        cpf_fmt: formatCPF(c.cpf),
        phone_fmt: formatPhone(c.phone),
        status_label: c.active_contract ? 'Ativo' : 'Inativo',
        balance_fmt: c.balance_due.toFixed(2),
        last_payment_fmt: c.last_payment_date ? formatDate(c.last_payment_date) : '—',
        rentals_count: String(rental?.count || 0),
        vehicles_rented: rental?.vehiclePlates.join(', ') || '—',
      };
    });

    exportReport(rows, columns as { key: keyof (typeof rows)[0]; label: string }[], {
      fileName: `relatorio-clientes-${dateRange.start}_${dateRange.end}`,
      sheetName: 'Clientes',
      format,
    });
  };

  const handlePrint = () => {
    const columns = [
      { label: 'Nome' }, { label: 'CPF' }, { label: 'Telefone' }, { label: 'Status' },
      { label: 'Saldo Devedor (R$)' }, { label: 'Último Pagamento' }, { label: 'Aluguéis' }, { label: 'Veículos' },
    ];
    const rows = filtered.map((c) => {
      const rental = rentalsByCustomer[c.id];
      return [
        c.name, formatCPF(c.cpf), formatPhone(c.phone), c.active_contract ? 'Ativo' : 'Inativo',
        c.balance_due.toFixed(2), c.last_payment_date ? formatDate(c.last_payment_date) : '—',
        String(rental?.count || 0), rental?.vehiclePlates.join(', ') || '—',
      ];
    });
    printReport({ title: 'Relatório de Clientes', subtitle: `Período: ${dateRange.start} a ${dateRange.end}`, columns, rows });
  };

  return (
    <div className="space-y-5">
      <ReportFilters dateRange={dateRange} onDateRangeChange={setDateRange}>
        <FilterSelect
          label="Cliente"
          value={customerFilter}
          onChange={setCustomerFilter}
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Todos os clientes"
        />
        <FilterSelect
          label="Status do Cliente"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'active', label: 'Com contrato ativo' },
            { value: 'inactive', label: 'Sem contrato ativo' },
            { value: 'debt', label: 'Com saldo devedor' },
          ]}
        />
      </ReportFilters>

      <ExportBar totalRecords={filtered.length} onExport={handleExport} onPrint={handlePrint} />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#004AAD] text-white">
              <tr className="[&>th]:text-left [&>th]:px-5 [&>th]:py-3.5 [&>th]:font-bold [&>th]:text-xs [&>th]:uppercase [&>th]:tracking-wider">
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Status</th>
                <th>Saldo Devedor</th>
                <th>Último Pagamento</th>
                <th>Aluguéis</th>
                <th>Veículos</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-sm">
                    Nenhum cliente encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 50).map((c) => {
                  const rental = rentalsByCustomer[c.id];
                  return (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-bold text-slate-700">{c.name}</td>
                      <td className="px-5 py-3 text-slate-600">{formatCPF(c.cpf)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatPhone(c.phone)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${c.active_contract ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {c.active_contract ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className={`px-5 py-3 font-bold ${c.balance_due > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                        R$ {c.balance_due.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{c.last_payment_date ? formatDate(c.last_payment_date) : '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{rental?.count || 0}</td>
                      <td className="px-5 py-3 text-slate-600 max-w-[200px] truncate">{rental?.vehiclePlates.join(', ') || '—'}</td>
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
