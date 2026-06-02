import { Link } from 'react-router-dom';
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

export default function CommissionApplications() {
  const submissions = useAppSelector((s) => s.data.submissions);
  const achievements = useAppSelector((s) => s.data.achievements);
  const users = useAppSelector((s) => s.data.users);
  const faculties = useAppSelector((s) => s.data.faculties);

  const list = submissions
    .map((sub) => {
      const student = users.find((u) => u.id === sub.userId);
      if (!student || student.role !== ROLES.STUDENT) return null;
      const subAch = getSubmissionAchievements(achievements, sub.id);
      const faculty = findFaculty(faculties, student.facultyId);
      return {
        sub,
        student,
        facultyLabel: faculty ? getFacultyLabel(faculty) : '—',
        filled: countFilledAchievements(subAch),
        totalScore: getSubmissionTotalScore(subAch),
      };
    })
    .filter(Boolean)
    .filter((row) => row.filled > 0 || row.sub.status !== 'draft');

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Комиссия">
      <header className="page-header">
        <h1>Заявления на ПГАС</h1>
        <p>Одно заявление на студента — внутри достижения по направлениям</p>
      </header>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Студент</th>
              <th>Группа</th>
              <th>Факультет</th>
              <th>Достижений</th>
              <th>Сумма баллов</th>
              <th>Статус заявления</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(({ sub, student, facultyLabel, filled, totalScore }) => (
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

      {list.length === 0 && (
        <div className="empty-state card">Нет поданных заявлений</div>
      )}
    </DashboardLayout>
  );
}
