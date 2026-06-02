import * as XLSX from 'xlsx';
import { formatFullName } from '../mock/users';
import { getFacultyLabel, findFaculty } from '../mock/faculties';
import { ACHIEVEMENT_STATUS_LABELS } from '../constants/achievements';
import { SUBMISSION_STATUS_LABELS } from '../constants/submissions';
import { getEffectiveScore } from './scoring';
import { UNIVERSITY } from '../config/university';
import { getSubmissionAchievements, getSubmissionTotalScore } from './submissions';

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

      if (subAch.length === 0) {
        rows.push({
          student: student ? formatFullName(student) : '—',
          group: student?.group || '—',
          faculty: faculty ? getFacultyLabel(faculty) : '—',
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
          submissionStatus: SUBMISSION_STATUS_LABELS[sub.status] || sub.status,
          totalScore: getSubmissionTotalScore(subAch),
          direction: dir?.title || '—',
          slot: (a.slotIndex ?? 0) + 1,
          title: a.title,
          achievementStatus: ACHIEVEMENT_STATUS_LABELS[a.status] || a.status,
          score: getEffectiveScore(a),
          level: a.achievementLevel,
        });
      });
    });
  return rows;
}

export function downloadXlsx(filename, rows) {
  const data = rows.map((r) => ({
    Студент: r.student,
    Группа: r.group,
    Факультет: r.faculty,
    'Статус заявления': r.submissionStatus,
    'Сумма баллов': r.totalScore,
    Направление: r.direction,
    '№ достижения': r.slot,
    Достижение: r.title,
    'Статус достижения': r.achievementStatus,
    Баллы: r.score,
    Уровень: r.level,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ведомость ПГАС');
  XLSX.writeFile(wb, filename);
}

export function downloadCsv(filename, rows) {
  downloadXlsx(filename.replace(/\.csv$/i, '.xlsx'), rows);
}

function buildReportHtml(rows) {
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
<th>Студент</th><th>Группа</th><th>Факультет</th><th>Заявление</th><th>Сумма</th>
<th>Направление</th><th>№</th><th>Достижение</th><th>Статус</th><th>Баллы</th>
</tr></thead>
<tbody>
${rows
  .map(
    (r) => `<tr>
<td>${esc(r.student)}</td><td>${esc(r.group)}</td><td>${esc(r.faculty)}</td>
<td>${esc(r.submissionStatus)}</td><td>${esc(r.totalScore)}</td>
<td>${esc(r.direction)}</td><td>${esc(r.slot)}</td><td>${esc(r.title)}</td>
<td>${esc(r.achievementStatus)}</td><td>${esc(r.score)}</td></tr>`
  )
  .join('')}
</tbody>
</table>
</body>
</html>`;
}

/** Печать через скрытый iframe — обходит блокировку about:blank */
export function printPdfReport(rows) {
  const html = buildReportHtml(rows);
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
