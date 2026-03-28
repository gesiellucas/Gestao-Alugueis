import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export type ExportFormat = 'xlsx' | 'csv';

interface ExportOptions {
  fileName: string;
  sheetName?: string;
  format: ExportFormat;
}

export function exportReport<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[],
  options: ExportOptions
) {
  if (data.length === 0) return;

  const headers = columns.map((c) => c.label);
  const rows = data.map((row) =>
    columns.map((c) => {
      const val = row[c.key];
      if (val == null) return '';
      return val;
    })
  );

  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-size columns
  const colWidths = columns.map((c, i) => {
    const maxLen = Math.max(
      c.label.length,
      ...rows.map((r) => String(r[i] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Relatório');

  if (options.format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${options.fileName}.csv`);
  } else {
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${options.fileName}.xlsx`);
  }
}
