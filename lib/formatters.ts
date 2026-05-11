/** Formata CPF: "12345678901" → "123.456.789-01" */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '—';
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Formata telefone brasileiro para exibição.
 * Aceita 11 dígitos ("11999999999") ou 13 com DDI ("5511999999999").
 * Resultado: "(11) 99999-9999"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  let d = phone.replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('55')) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

/** Formata data ISO para "DD/MM/AAAA" no locale pt-BR */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('pt-BR');
}

/** Formata data+hora ISO para "DD/MM/AAAA HH:mm" no locale pt-BR */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return (
    date.toLocaleDateString('pt-BR') +
    ' ' +
    date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

/** Máscara de CPF para uso em inputs: aplica "000.000.000-00" em tempo real */
export function maskCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Máscara de telefone para uso em inputs: aplica "(11) 99999-9999" em tempo real */
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Remove formatação de CPF para armazenamento: "123.456.789-01" → "12345678901" */
export function rawCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/** Remove formatação de telefone para armazenamento: "(11) 99999-9999" → "11999999999" */
export function rawPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Formata valor monetário para BRL.
 * Aceita número ou string em formato livre ("700", "700,00", "1.500,00", "R$ 700,00").
 */
export function formatBRL(value: string | number): string {
  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else {
    const cleaned = value.replace(/[R$\s]/g, '');
    const normalized = cleaned.includes(',')
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned;
    num = parseFloat(normalized);
  }
  if (isNaN(num)) return typeof value === 'string' ? value : String(value);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Retorna número no formato correto para links wa.me.
 * Adiciona DDI "55" se necessário.
 */
export function toWhatsApp(phone: string | null | undefined): string {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('55') && d.length >= 12) return d;
  return '55' + d;
}
