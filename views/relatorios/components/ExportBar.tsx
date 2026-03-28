'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Printer } from 'lucide-react';
import type { ExportFormat } from '@/lib/exportReport';

interface ExportBarProps {
  totalRecords: number;
  onExport: (format: ExportFormat) => void;
  onPrint: () => void;
}

export const ExportBar: React.FC<ExportBarProps> = ({ totalRecords, onExport, onPrint }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    setDropdownOpen(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2">
        <Download size={18} className="text-slate-400" />
        <span className="text-sm font-bold text-slate-600">
          {totalRecords} registro{totalRecords !== 1 ? 's' : ''} encontrado{totalRecords !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex items-center gap-3">

        {/* Export dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            disabled={totalRecords === 0}
            className="flex items-center gap-2 bg-[#004AAD] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-[#003d91] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Exportar
            <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl shadow-black/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => handleExport('xlsx')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FileSpreadsheet size={16} className="text-green-600" />
                Exportar XLSX
              </button>
              <div className="border-t border-slate-100" />
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <FileText size={16} className="text-blue-600" />
                Exportar CSV
              </button>
              <div className="border-t border-slate-100" />
              <button
                onClick={onPrint}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Printer size={16} className="text-blue-600" />
                Imprimir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
