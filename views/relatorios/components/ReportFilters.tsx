'use client';
import React from 'react';
import { Calendar, Search } from 'lucide-react';

export interface DateRange {
  start: string;
  end: string;
}

interface ReportFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  children?: React.ReactNode;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  dateRange,
  onDateRangeChange,
  children,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest">
        <Search size={16} />
        Filtros do Relatório
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Date range - always present */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
            <Calendar size={12} className="inline mr-1" />
            Data Início
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, start: e.target.value })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
            <Calendar size={12} className="inline mr-1" />
            Data Fim
          </label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, end: e.target.value })
            }
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Extra filters injected per tab */}
        {children}
      </div>
    </div>
  );
};

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Todos',
}) => {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm appearance-none focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500 outline-none transition-all"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
