import { useMemo } from 'react';
import Navbar from '../components/Navbar';
import { useAppSelector } from '../store/hooks';
import { buildOverallRating, getStudentTotalScore } from '../utils/rating';
import { findFaculty, getFacultyLabel } from '../mock/faculties';
import { ROLES } from '../mock/users';
import { UNIVERSITY } from '../config/university';

export default function Rating() {
  const user = useAppSelector((s) => s.auth.user);
  const users = useAppSelector((s) => s.data.users);
  const achievements = useAppSelector((s) => s.data.achievements);
  const faculties = useAppSelector((s) => s.data.faculties);

  const facultyId = user?.facultyId;
  const faculty = findFaculty(faculties, facultyId);

  const ratingRows = useMemo(
    () => buildOverallRating(users, achievements, faculties),
    [users, achievements, faculties]
  );

  const myScore = user?.role === ROLES.STUDENT ? getStudentTotalScore(user.id, achievements) : 0;
  const myPlace = ratingRows.find((r) => r.student.id === user?.id)?.place;

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container page-content">
        <header className="page-header">
          <h1>Рейтинг студентов</h1>
          <p>
            Общий зачёт по сумме баллов за поданные достижения по всем факультетам —{' '}
            {UNIVERSITY.shortName}
          </p>
        </header>

        <div className="card rating-summary">
          <p>
            <strong>Ваш факультет:</strong> {faculty ? getFacultyLabel(faculty) : 'Не назначен'}
          </p>
          {user?.role === ROLES.STUDENT && (
            <p>
              <strong>Ваши баллы:</strong> {myScore}
              {myPlace ? (
                <>
                  {' '}
                  · <strong>Место в рейтинге:</strong> {myPlace}
                </>
              ) : (
                ' · Подайте заявление, чтобы попасть в рейтинг'
              )}
            </p>
          )}
          <p className="form-hint rating-live">
            <span className="rating-live__dot" aria-hidden />
            Обновляется автоматически при изменении заявлений и баллов
          </p>
        </div>

        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Место</th>
                <th>Студент</th>
                <th>Факультет</th>
                <th>Группа</th>
                <th>Достижений</th>
                <th>Сумма баллов</th>
              </tr>
            </thead>
            <tbody>
              {ratingRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Пока нет студентов с поданными достижениями
                  </td>
                </tr>
              ) : (
                ratingRows.map((row) => (
                  <tr
                    key={row.student.id}
                    className={row.student.id === user?.id ? 'data-table__row--self' : ''}
                  >
                    <td>
                      <span
                        className={
                          'rating-place' +
                          (row.place <= 3 ? ` rating-place--top${row.place}` : '')
                        }
                      >
                        {row.place}
                      </span>
                    </td>
                    <td>{row.fullName}</td>
                    <td>{row.facultyLabel}</td>
                    <td>{row.student.group || '—'}</td>
                    <td>{row.achievementsCount}</td>
                    <td>
                      <strong>{row.totalScore}</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
