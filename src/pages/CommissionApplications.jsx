import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { commissionSidebar } from '../config/navigation';
import { useAppSelector } from '../store/hooks';
import { formatFullName, ROLES } from '../mock/users';
import { SUBMISSION_STATUS_LABELS } from '../constants/submissions';
import {
  getSubmissionAchievements,
  getSubmissionTotalScore,
  countFilledAchievements,
} from '../utils/submissions';
import { findFaculty, getFacultyLabel } from '../mock/faculties';
import SortableHeader from '../components/SortableHeader';
import { sortBySelectors, toggleSortState } from '../utils/tableSort';

export default function CommissionApplications() {
  const submissions = useAppSelector((s) => s.data.submissions);
  const achievements = useAppSelector((s) => s.data.achievements);
  const users = useAppSelector((s) => s.data.users);
  const faculties = useAppSelector((s) => s.data.faculties);
  const user = useAppSelector((s) => s.auth.user);
  const allowedDirections = user?.permissions?.allowedDirectionIds || [];
  const [sortState, setSortState] = useState({ key: 'studentName', dir: 'asc' });

  const list = useMemo(
    () =>
      submissions
        .map((sub) => {
          const student = users.find((u) => u.id === sub.userId);
          if (!student || student.role !== ROLES.STUDENT) return null;
          const subAch = getSubmissionAchievements(achievements, sub.id);
          const faculty = findFaculty(faculties, student.facultyId);
          const hasSubmitted = sub.status !== 'draft' || subAch.some((a) => a.status !== 'draft');
          const hasVisibleDirection =
            allowedDirections.length === 0 ||
            subAch.some((a) => a.title && allowedDirections.includes(a.directionId));
          return {
            sub,
            student,
            facultyLabel: faculty ? getFacultyLabel(faculty) : '—',
            filled: countFilledAchievements(subAch),
            totalScore: getSubmissionTotalScore(subAch),
            hasSubmitted,
            hasVisibleDirection,
          };
        })
        .filter(Boolean)
        .filter((row) => row.hasSubmitted && row.filled > 0 && row.hasVisibleDirection),
    [submissions, users, achievements, faculties, allowedDirections]
  );

  const sortedList = useMemo(
    () =>
      sortBySelectors(list, sortState, {
        studentName: (row) => formatFullName(row.student),
        group: (row) => row.student.group || '',
        facultyLabel: (row) => row.facultyLabel,
        filled: (row) => row.filled,
        totalScore: (row) => row.totalScore,
        status: (row) => row.sub.status,
      }),
    [list, sortState]
  );

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Кабинет комиссии">
      <header className="page-header">
        <h1>Заявления на ПГАС</h1>
        <p>Одно заявление на студента — внутри достижения по направлениям</p>
      </header>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
                <th>
                  <SortableHeader
                    label="Студент"
                    sortKey="studentName"
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
                    label="Факультет"
                    sortKey="facultyLabel"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Достижений"
                    sortKey="filled"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key, 'desc'))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Сумма баллов"
                    sortKey="totalScore"
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedList.map(({ sub, student, facultyLabel, filled, totalScore }) => (
              <tr key={sub.id}>
                <td>{formatFullName(student)}</td>
                <td>{student.group || '—'}</td>
                <td>{facultyLabel}</td>
                <td>{filled}</td>
                <td>{totalScore}</td>
                <td>
                  <span className={`badge badge--${sub.status}`}>
                    {SUBMISSION_STATUS_LABELS[sub.status]}
                  </span>
                </td>
                <td>
                  <Link
                    to={`/commission/applications/${sub.id}`}
                    className="btn btn--primary btn--sm"
                  >
                    Открыть
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedList.length === 0 && (
        <div className="empty-state card">Нет поданных заявлений</div>
      )}
    </DashboardLayout>
  );
}
