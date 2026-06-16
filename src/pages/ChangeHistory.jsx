import DashboardLayout from '../layouts/DashboardLayout';
import { useMemo, useState } from 'react';
import { adminSidebar, commissionSidebar } from '../config/navigation';
import { useAppSelector } from '../store/hooks';
import { ROLES, formatFullName } from '../mock/users';
import {
  getSubmissionAchievements,
  getSubmissionTotalScore,
  isHistoricalSubmission,
} from '../utils/submissions';
import { Link } from 'react-router-dom';
import { findFaculty, getFacultyLabel } from '../mock/faculties';
import SortableHeader from '../components/SortableHeader';
import { sortBySelectors, toggleSortState } from '../utils/tableSort';

const CATEGORY_LABELS = {
  'auth.login': 'Вход в систему',
  'auth.logout': 'Выход из системы',
  'auth.register': 'Регистрация',
  regulations: 'Регламент',
  scoring: 'Матрица баллов',
  'admin.users': 'Пользователи',
  users: 'Пользователи',
  'commission.review': 'Рассмотрение заявлений',
  faculties: 'Факультеты',
  groups: 'Группы',
  tooltips: 'Подсказки',
  directions: 'Направления',
  general: 'Общее',
};

const ACTION_LABELS = {
  login: 'Вход',
  logout: 'Выход',
  register: 'Регистрация',
  create: 'Создание',
  update: 'Изменение',
  delete: 'Удаление',
  review: 'Рассмотрение',
};

const SUBMISSION_STATUS_LABELS = {
  approved: 'Одобрено',
  rejected: 'Отклонено',
  revision: 'На доработке',
  submitted: 'Подано',
};

function formatArchiveDate(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChangeHistory() {
  const user = useAppSelector((s) => s.auth.user);
  const history = useAppSelector((s) => s.data.history);
  const submissions = useAppSelector((s) => s.data.submissions);
  const achievements = useAppSelector((s) => s.data.achievements);
  const users = useAppSelector((s) => s.data.users);
  const faculties = useAppSelector((s) => s.data.faculties);
  const regulations = useAppSelector((s) => s.data.regulations);
  const sidebar = user?.role === ROLES.ADMIN ? adminSidebar : commissionSidebar;
  const title = user?.role === ROLES.ADMIN ? 'Администрирование' : 'Кабинет комиссии';
  const isAdmin = user?.role === ROLES.ADMIN;
  const [auditSort, setAuditSort] = useState({ key: 'date', dir: 'desc' });
  const [archiveSort, setArchiveSort] = useState({ key: 'date', dir: 'desc' });

  const sortedAudit = useMemo(
    () =>
      sortBySelectors(history, auditSort, {
        date: (row) => new Date(row.createdAt).getTime(),
        category: (row) => CATEGORY_LABELS[row.category] || row.category,
        action: (row) => ACTION_LABELS[row.action] || row.action,
        summary: (row) => row.summary,
        user: (row) => row.userName || row.userId || '',
      }),
    [history, auditSort]
  );

  const archivedSubmissions = useMemo(
    () =>
      submissions
        .filter((s) => s.status !== 'draft')
        .map((sub) => {
          const student = users.find((u) => u.id === sub.userId);
          const faculty = student ? findFaculty(faculties, student.facultyId) : null;
          const subAchievements = getSubmissionAchievements(achievements, sub.id).filter(
            (a) => a.title
          );
          if (!student || subAchievements.length === 0) return null;
          return {
            sub,
            student,
            faculty,
            achievementsCount: subAchievements.length,
            totalScore: getSubmissionTotalScore(subAchievements),
            isHistorical: isHistoricalSubmission(sub, regulations),
          };
        })
        .filter(Boolean),
    [submissions, users, faculties, achievements, regulations]
  );

  const sortedArchived = useMemo(
    () =>
      sortBySelectors(archivedSubmissions, archiveSort, {
        date: (row) => new Date(row.sub.updatedAt || row.sub.createdAt).getTime(),
        student: (row) => formatFullName(row.student),
        faculty: (row) => (row.faculty ? getFacultyLabel(row.faculty) : ''),
        group: (row) => row.student.group || '',
        achievements: (row) => row.achievementsCount,
        totalScore: (row) => row.totalScore,
        status: (row) => row.sub.status,
      }),
    [archivedSubmissions, archiveSort]
  );

  return (
    <DashboardLayout sidebarItems={sidebar} sidebarTitle={title}>
      <header className="page-header">
        <h1>{isAdmin ? 'Аудит действий' : 'Архив заявлений'}</h1>
        <p>
          {isAdmin
            ? 'Журнал входов, изменений справочников, пользователей и действий комиссии'
            : 'Все поданные заявления студентов, включая прошлые периоды. Оценка доступна только для актуальных заявлений и разрешённых направлений.'}
        </p>
      </header>

      {isAdmin ? (
        <div className="table-wrap table-wrap--auto">
          <table className="data-table data-table--adaptive data-table--audit">
            <thead>
              <tr>
                <th>
                  <SortableHeader
                    label="Дата"
                    sortKey="date"
                    sortState={auditSort}
                    onToggle={(key) => setAuditSort(toggleSortState(auditSort, key, 'desc'))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Раздел"
                    sortKey="category"
                    sortState={auditSort}
                    onToggle={(key) => setAuditSort(toggleSortState(auditSort, key))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Тип"
                    sortKey="action"
                    sortState={auditSort}
                    onToggle={(key) => setAuditSort(toggleSortState(auditSort, key))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Описание"
                    sortKey="summary"
                    sortState={auditSort}
                    onToggle={(key) => setAuditSort(toggleSortState(auditSort, key))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Кто"
                    sortKey="user"
                    sortState={auditSort}
                    onToggle={(key) => setAuditSort(toggleSortState(auditSort, key))}
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAudit.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    История пока пуста. Записи появятся после входов и изменений в системе.
                  </td>
                </tr>
              ) : (
                sortedAudit.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.createdAt).toLocaleString('ru-RU')}</td>
                    <td>{CATEGORY_LABELS[h.category] || h.category}</td>
                    <td>{ACTION_LABELS[h.action] || h.action || '—'}</td>
                    <td>{h.summary}</td>
                    <td>{h.userName || h.userId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap archive-table-wrap">
          <table className="data-table archive-table">
            <thead>
              <tr>
                <th>
                  <SortableHeader
                    label="Дата"
                    sortKey="date"
                    sortState={archiveSort}
                    onToggle={(key) => setArchiveSort(toggleSortState(archiveSort, key, 'desc'))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Студент"
                    sortKey="student"
                    sortState={archiveSort}
                    onToggle={(key) => setArchiveSort(toggleSortState(archiveSort, key))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Факультет"
                    sortKey="faculty"
                    sortState={archiveSort}
                    onToggle={(key) => setArchiveSort(toggleSortState(archiveSort, key))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Группа"
                    sortKey="group"
                    sortState={archiveSort}
                    onToggle={(key) => setArchiveSort(toggleSortState(archiveSort, key))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Дост."
                    sortKey="achievements"
                    sortState={archiveSort}
                    onToggle={(key) => setArchiveSort(toggleSortState(archiveSort, key, 'desc'))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Баллы"
                    sortKey="totalScore"
                    sortState={archiveSort}
                    onToggle={(key) => setArchiveSort(toggleSortState(archiveSort, key, 'desc'))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Статус"
                    sortKey="status"
                    sortState={archiveSort}
                    onToggle={(key) => setArchiveSort(toggleSortState(archiveSort, key))}
                  />
                </th>
                <th>Открыть</th>
              </tr>
            </thead>
            <tbody>
              {sortedArchived.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-state">
                    Архив пока пуст
                  </td>
                </tr>
              ) : (
                sortedArchived.map(({ sub, student, faculty, achievementsCount, totalScore, isHistorical }) => (
                  <tr key={sub.id}>
                    <td>
                      {formatArchiveDate(sub.updatedAt || sub.createdAt)}
                      {isHistorical && (
                        <span className="form-hint" style={{ display: 'block' }}>
                          архив
                        </span>
                      )}
                    </td>
                    <td>{formatFullName(student)}</td>
                    <td>{faculty ? getFacultyLabel(faculty) : '—'}</td>
                    <td>{student.group || '—'}</td>
                    <td>{achievementsCount}</td>
                    <td>{totalScore}</td>
                    <td>{SUBMISSION_STATUS_LABELS[sub.status] || 'Подано'}</td>
                    <td className="archive-table__open">
                      <Link
                        to={`/commission/applications/${sub.id}?archive=1`}
                        className="btn btn--ghost btn--sm"
                      >
                        Открыть
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
