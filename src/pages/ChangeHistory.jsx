import DashboardLayout from '../layouts/DashboardLayout';
import { useMemo, useState } from 'react';
import { adminSidebar, commissionSidebar } from '../config/navigation';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';
import { formatFullName } from '../mock/users';
import { getSubmissionAchievements } from '../utils/submissions';
import { Link } from 'react-router-dom';
import { findFaculty, getFacultyLabel } from '../mock/faculties';
import SortableHeader from '../components/SortableHeader';
import { sortBySelectors, toggleSortState } from '../utils/tableSort';

const CATEGORY_LABELS = {
  regulations: 'Регламент',
  scoring: 'Уровни достижений',
  'admin.users': 'Пользователи',
  'commission.review': 'Обзор комиссии',
};

const SUBMISSION_STATUS_LABELS = {
  approved: 'Одобрено',
  rejected: 'Отклонено',
  revision: 'На доработке',
  submitted: 'Подано',
};

export default function ChangeHistory() {
  const user = useAppSelector((s) => s.auth.user);
  const history = useAppSelector((s) => s.data.history);
  const submissions = useAppSelector((s) => s.data.submissions);
  const achievements = useAppSelector((s) => s.data.achievements);
  const users = useAppSelector((s) => s.data.users);
  const faculties = useAppSelector((s) => s.data.faculties);
  const sidebar = user?.role === ROLES.ADMIN ? adminSidebar : commissionSidebar;
  const title = user?.role === ROLES.ADMIN ? 'Администрирование' : 'Кабинет комиссии';
  const isAdmin = user?.role === ROLES.ADMIN;
  const [sortState, setSortState] = useState({ key: 'date', dir: 'desc' });
  const archivedSubmissions = submissions
    .filter((s) => s.status !== 'draft')
    .map((sub) => {
      const student = users.find((u) => u.id === sub.userId);
      const subHistory = history.find((h) => h.targetId === sub.id);
      const faculty = student ? findFaculty(faculties, student.facultyId) : null;
      const subAchievements = getSubmissionAchievements(achievements, sub.id).filter((a) => a.title);
      if (!student || subAchievements.length === 0) return null;
      return {
        sub,
        student,
        faculty,
        subHistory,
        achievementsCount: subAchievements.length,
      };
    })
    .filter(Boolean);
  const sortedArchived = useMemo(
    () =>
      sortBySelectors(archivedSubmissions, sortState, {
        date: (row) => new Date(row.sub.updatedAt || row.sub.createdAt).getTime(),
        student: (row) => formatFullName(row.student),
        faculty: (row) => (row.faculty ? getFacultyLabel(row.faculty) : ''),
        group: (row) => row.student.group || '',
        achievements: (row) => row.achievementsCount,
        status: (row) => row.sub.status,
        action: (row) => row.subHistory?.summary || 'Проверка/оценка достижений',
      }),
    [archivedSubmissions, sortState]
  );

  return (
    <DashboardLayout sidebarItems={sidebar} sidebarTitle={title}>
      <header className="page-header">
        <h1>{isAdmin ? 'Аудит действий' : 'Архив заявлений и действий комиссии'}</h1>
        <p>
          {isAdmin
            ? 'Все действия в системе администрирования и комиссии'
            : 'Поданные заявления студентов и действия члена комиссии'}
        </p>
      </header>

      {isAdmin ? (
        <div className="table-wrap table-wrap--auto">
          <table className="data-table data-table--adaptive">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Раздел</th>
                <th>Действие</th>
                <th>Кто</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    История пока пуста
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.createdAt).toLocaleString('ru-RU')}</td>
                    <td>{CATEGORY_LABELS[h.category] || h.category}</td>
                    <td>{h.summary}</td>
                    <td>{h.userName || h.userId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap table-wrap--auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <SortableHeader
                    label="Дата"
                    sortKey="date"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key, 'desc'))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Студент"
                    sortKey="student"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Факультет"
                    sortKey="faculty"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Группа"
                    sortKey="group"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Достижений"
                    sortKey="achievements"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key, 'desc'))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Статус заявления"
                    sortKey="status"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Действие комиссии"
                    sortKey="action"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                  />
                </th>
                <th></th>
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
                sortedArchived.map(({ sub, student, faculty, subHistory, achievementsCount }) => (
                  <tr key={sub.id}>
                    <td>{new Date(sub.updatedAt || sub.createdAt).toLocaleString('ru-RU')}</td>
                    <td>{formatFullName(student)}</td>
                    <td>{faculty ? getFacultyLabel(faculty) : '—'}</td>
                    <td>{student.group || '—'}</td>
                    <td>{achievementsCount}</td>
                    <td>{SUBMISSION_STATUS_LABELS[sub.status] || 'Подано'}</td>
                    <td>{subHistory?.summary || 'Проверка/оценка достижений'}</td>
                    <td>
                      <Link
                        to={`/commission/applications/${sub.id}`}
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
