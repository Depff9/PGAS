import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { formatFullName } from '../mock/users';
import { getFacultyLabel, findFaculty } from '../mock/faculties';
import { ACHIEVEMENT_STATUS_LABELS } from '../constants/achievements';
import { SUBMISSION_STATUS_LABELS } from '../constants/submissions';
import { getEffectiveScore } from './scoring';
import { UNIVERSITY } from '../config/university';
import { getSubmissionAchievements, getSubmissionTotalScore } from './submissions';

function formatSubmissionDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
const LEVEL_LABELS = {
  faculty: 'Внутривузовский',
  regional: 'Региональный',
  federal: 'Всероссийский',
  international: 'Международный',
};

const DEFAULT_EXPORT_COLUMNS = [
  { id: 'student', label: 'Студент' },
  { id: 'group', label: 'Группа' },
  { id: 'faculty', label: 'Факультет' },
  { id: 'submittedAt', label: 'Дата подачи' },
  { id: 'submissionStatus', label: 'Статус заявления' },
  { id: 'totalScore', label: 'Сумма баллов' },
  { id: 'direction', label: 'Направление' },
  { id: 'slot', label: '№ достижения' },
  { id: 'title', label: 'Достижение' },
  { id: 'achievementStatus', label: 'Статус достижения' },
  { id: 'score', label: 'Баллы комиссии' },
  { id: 'level', label: 'Уровень достижения' },
];

export function buildExportRows(submissions, achievements, users, directions, faculties) {
  const rows = [];
  submissions
    .filter((s) => s.status !== 'draft')
    .forEach((sub) => {
      const student = users.find((u) => u.id === sub.userId);
      const faculty = findFaculty(faculties, student?.facultyId);
      const subAch = getSubmissionAchievements(achievements, sub.id).filter(
        (a) => a.title && a.status !== 'draft'
      );

      const submittedAt = formatSubmissionDate(sub.submittedAt || sub.createdAt);

      if (subAch.length === 0) {
        rows.push({
          student: student ? formatFullName(student) : '—',
          group: student?.group || '—',
          faculty: faculty ? getFacultyLabel(faculty) : '—',
          submittedAt,
          submissionStatus: SUBMISSION_STATUS_LABELS[sub.status] || sub.status,
          totalScore: 0,
          direction: '—',
          slot: '—',
          title: '—',
          achievementStatus: '—',
          score: 0,
          level: '—',
        });
        return;
      }

      subAch.forEach((a) => {
        const dir = directions.find((d) => d.id === a.directionId);
        rows.push({
          student: student ? formatFullName(student) : '—',
          group: student?.group || '—',
          faculty: faculty ? getFacultyLabel(faculty) : '—',
          submittedAt,
          submissionStatus: SUBMISSION_STATUS_LABELS[sub.status] || sub.status,
          totalScore: getSubmissionTotalScore(subAch),
          direction: dir?.title || '—',
          slot: (a.slotIndex ?? 0) + 1,
          title: a.title,
          achievementStatus: ACHIEVEMENT_STATUS_LABELS[a.status] || a.status,
          score: getEffectiveScore(a),
          level: LEVEL_LABELS[a.achievementLevel] || a.achievementLevel || '—',
        });
      });
    });
  return rows;
}

export function downloadXlsx(filename, rows, columns = DEFAULT_EXPORT_COLUMNS) {
  const data = rows.map((r) =>
    Object.fromEntries(columns.map((col) => [col.label, r[col.id] ?? '—']))
  );
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ведомость ПГАС');
  XLSX.writeFile(wb, filename);
}

export function downloadDoc(filename, rows, columns = DEFAULT_EXPORT_COLUMNS) {
  const header = columns.map((c) => c.label);

  const toCell = (text, bold = false) =>
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ''), bold })] })],
    });

  const tableRows = [
    new TableRow({ children: header.map((h) => toCell(h, true)) }),
    ...rows.map(
      (r) =>
        new TableRow({
          children: columns.map((col) => toCell(r[col.id] ?? '—')),
        })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Ведомость заявлений на ПГАС', bold: true, size: 32 })],
          }),
          new Paragraph({ children: [new TextRun(UNIVERSITY.officialName)] }),
          new Paragraph({
            children: [new TextRun(`Сформировано: ${new Date().toLocaleString('ru-RU')}`)],
          }),
          new Paragraph(''),
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
        ],
      },
    ],
  });

  Packer.toBlob(doc).then((blob) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
  });
}

function buildReportHtml(rows, columns = DEFAULT_EXPORT_COLUMNS) {
  const esc = (s) =>
    String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8"/>
<title>Ведомость ПГАС — ${esc(UNIVERSITY.shortName)}</title>
<style>
body{font-family:Arial,sans-serif;padding:24px;font-size:11px;color:#111}
h1{font-size:18px;margin:0 0 8px}
.meta{margin-bottom:16px;color:#444}
table{width:100%;border-collapse:collapse}
th,td{border:1px solid #333;padding:5px 6px;text-align:left;vertical-align:top}
th{background:#dbeafe}
@media print{.no-print{display:none}}
</style>
</head>
<body>
<h1>Ведомость заявлений на ПГАС</h1>
<p class="meta">${esc(UNIVERSITY.officialName)}<br/>
Сформировано: ${esc(new Date().toLocaleString('ru-RU'))}</p>
<p class="no-print"><button type="button" onclick="window.print()">Печать / сохранить как PDF</button></p>
<table>
<thead><tr>
${columns.map((c) => `<th>${esc(c.label)}</th>`).join('')}
</tr></thead>
<tbody>
${rows
  .map(
    (r) => `<tr>
${columns.map((c) => `<td>${esc(r[c.id] ?? '—')}</td>`).join('')}</tr>`
  )
  .join('')}
</tbody>
</table>
</body>
</html>`;
}

/** Печать через скрытый iframe — обходит блокировку about:blank */
export function printPdfReport(rows, columns = DEFAULT_EXPORT_COLUMNS) {
  const html = buildReportHtml(rows, columns);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } finally {
        setTimeout(() => iframe.remove(), 1000);
      }
    }, 300);
  };
}
