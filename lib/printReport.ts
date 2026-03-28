interface PrintColumn {
  label: string;
}

interface PrintOptions {
  title: string;
  subtitle?: string;
  columns: PrintColumn[];
  rows: string[][];
}

export function printReport({ title, subtitle, columns, rows }: PrintOptions) {
  const headerCells = columns.map((c) => `<th>${c.label}</th>`).join('');
  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 32px; }
    .header { margin-bottom: 24px; border-bottom: 3px solid #004AAD; padding-bottom: 16px; }
    .header h1 { font-size: 22px; color: #004AAD; }
    .header p { font-size: 12px; color: #64748b; margin-top: 4px; }
    .meta { font-size: 11px; color: #94a3b8; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #004AAD; color: #fff; text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    @media print {
      body { padding: 16px; }
      @page { margin: 12mm; size: landscape; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    ${subtitle ? `<p>${subtitle}</p>` : ''}
  </div>
  <div class="meta">Gerado em ${new Date().toLocaleString('pt-BR')} &mdash; ${rows.length} registro${rows.length !== 1 ? 's' : ''}</div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">GC Locamoto &mdash; Relat&oacute;rio gerado automaticamente</div>
</body>
</html>`;

  // Use a hidden iframe instead of window.open — works reliably in Electron
  const existing = document.getElementById('print-frame');
  if (existing) existing.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'print-frame';
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for content to render before printing
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };

  // Fallback: if onload doesn't fire (some Electron versions), try after a short delay
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // iframe may already have been used for printing
    }
  }, 500);
}
