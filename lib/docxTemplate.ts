/**
 * Geração de contratos DOCX a partir de templates.
 *
 * Abordagem: substituição no nível de texto dos elementos <w:t>.
 *
 * O Word fragmenta as variáveis {{ }} em múltiplos XML runs (cada { ou }
 * pode estar em seu próprio <w:t>). Em vez de tentar reparar o XML,
 * extraímos o texto plano de todos os <w:t>, fazemos a substituição no
 * texto concatenado, e devolvemos os fragmentos para seus elementos originais.
 */
import { saveAs } from 'file-saver';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PizZip = require('pizzip');

interface WtElement {
  xmlStart: number;
  openTag: string;
  text: string;
  closeTag: string;
  xmlEnd: number;
}

interface FlatOffset {
  flatStart: number;
  flatEnd: number;
  el: WtElement;
}

function fillXmlByTextLevel(xml: string, data: Record<string, string>): string {
  // 1. Remover marcadores de spell/grammar check que fragmentam os runs
  xml = xml.replace(/<w:proofErr[^/]*\/>/g, '');

  // 2. Extrair todos os elementos <w:t> com posições no XML
  const wtRegex = /(<w:t[^>]*>)([^<]*)(<\/w:t>)/g;
  let m: RegExpExecArray | null;
  const elements: WtElement[] = [];
  while ((m = wtRegex.exec(xml)) !== null) {
    elements.push({
      xmlStart: m.index,
      openTag: m[1],
      text: m[2],
      closeTag: m[3],
      xmlEnd: m.index + m[0].length,
    });
  }

  // 3. Construir flat text e mapeamento de offsets
  let flatText = '';
  const offsets: FlatOffset[] = [];
  for (const el of elements) {
    offsets.push({ flatStart: flatText.length, flatEnd: flatText.length + el.text.length, el });
    flatText += el.text;
  }

  // 4. Encontrar todas as tags {{ varname }} no flat text
  const tagRegex = /\{\{([^}]+)\}\}/g;
  let tagMatch: RegExpExecArray | null;
  const replacements: { start: number; end: number; value: string }[] = [];
  while ((tagMatch = tagRegex.exec(flatText)) !== null) {
    const varname = tagMatch[1].trim();
    if (varname in data) {
      replacements.push({ start: tagMatch.index, end: tagMatch.index + tagMatch[0].length, value: data[varname] });
    }
  }

  // 5. Aplicar substituições da direita para esquerda: posições originais no
  //    flatText permanecem válidas para os itens ainda não processados.
  replacements.sort((a, b) => b.start - a.start);

  for (const rep of replacements) {
    const involved = offsets.filter((o) => o.flatEnd > rep.start && o.flatStart < rep.end);
    if (!involved.length) continue;

    for (let i = 0; i < involved.length; i++) {
      const o = involved[i];
      if (i === 0) {
        const localStart = rep.start - o.flatStart;
        const localEnd = Math.min(rep.end - o.flatStart, o.el.text.length);
        const before = o.el.text.slice(0, localStart);
        const after = o.el.text.slice(localEnd);
        o.el.text = before + rep.value + after;
      } else {
        const localEnd = Math.min(rep.end - o.flatStart, o.el.text.length);
        o.el.text = o.el.text.slice(localEnd);
      }
    }
  }

  // 6. Reconstruir o XML com os textos substituídos
  let newXml = '';
  let prevEnd = 0;
  for (const el of elements) {
    newXml += xml.slice(prevEnd, el.xmlStart);
    newXml += el.openTag + el.text + el.closeTag;
    prevEnd = el.xmlEnd;
  }
  newXml += xml.slice(prevEnd);
  return newXml;
}

export async function fetchTemplateBuffer(templatePath: string): Promise<ArrayBuffer> {
  const res = await fetch(templatePath);
  if (!res.ok) throw new Error(`Falha ao carregar template: ${templatePath}`);
  return res.arrayBuffer();
}

export function fillDocxTemplate(
  buffer: ArrayBuffer,
  data: Record<string, string>,
): Blob {
  const zip = new PizZip(buffer);

  const docXml: string = zip.files['word/document.xml'].asText();
  zip.file('word/document.xml', fillXmlByTextLevel(docXml, data));

  const out: ArrayBuffer = zip.generate({
    type: 'arraybuffer',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

export function downloadDocx(blob: Blob, filename: string): void {
  saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`);
}

const MESES_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function buildDateFields(date: Date = new Date()): Record<string, string> {
  return {
    dia_contrato: String(date.getDate()).padStart(2, '0'),
    mes_contrato_extenso: MESES_PT[date.getMonth()],
    ano_contrato: String(date.getFullYear()),
  };
}
