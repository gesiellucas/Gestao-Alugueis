'use client';
import React from 'react';
import { Wand2 } from 'lucide-react';
import { ContratoTemplateField } from '../../../types';
import { maskCPF, maskPhone } from '../../../lib/formatters';

interface ContratoFormFieldProps {
  field: ContratoTemplateField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoFilled?: boolean;
}

export const ContratoFormField: React.FC<ContratoFormFieldProps> = ({
  field, value, onChange, error, autoFilled,
}) => {
  const baseClass = `w-full px-4 py-3 border rounded-xl text-sm font-medium text-slate-700 outline-none transition-all
    focus:ring-4 focus:ring-[#004AAD]/10 focus:border-blue-500
    ${error ? 'border-red-300 bg-red-50' : autoFilled ? 'border-blue-200 bg-blue-50/40' : 'border-slate-200 bg-white'}`;

  const handleChange = (raw: string) => {
    if (field.type === 'cpf') return onChange(maskCPF(raw));
    if (field.type === 'phone') return onChange(maskPhone(raw));
    onChange(raw);
  };

  return (
    <div className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
        {autoFilled && (
          <span className="inline-flex items-center gap-1 text-blue-500 font-semibold normal-case tracking-normal text-[10px] bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
            <Wand2 size={9} />
            Automático
          </span>
        )}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className={`${baseClass} resize-none`}
        />
      ) : field.type === 'select' ? (
        <select value={value} onChange={(e) => handleChange(e.target.value)} className={baseClass}>
          <option value="">Selecione...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder}
          className={baseClass}
        />
      )}

      {error && <p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
};
