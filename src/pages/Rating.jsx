import { useMemo } from 'react';
import Navbar from '../components/Navbar';
import { useAppSelector } from '../store/hooks';
import { buildFacultyRating, getStudentTotalScore } from '../utils/rating';
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

  const rating = useMemo(
    () =>
      facultyId
        ? buildFacultyRating(facultyId, users, achievements, faculties)
        : { faculty: null, facultyLabel: '—', rows: [] },
    [facultyId, users, achievements, faculties]
  );

  const myScore = user?.role === ROLES.STUDENT ? getStudentTotalScore(user.id, achievements) : 0;
  const myPlace = rating.rows.find((r) => r.student.id === user?.id)?.place;

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container page-content">
        <header className="page-header">
          <h1>Рейтинг студентов</h1>
          <p>
            Общий зачёт по сумме баллов за поданные достижения в рамках вашего факультета —{' '}
            {UNIVERSITY.shortName}
          </p>
        </header>

        {!facultyId ? (
          <div className="alert alert--info">
            Факультет не назначен. Обратитесь к администратору {UNIVERSITY.shortName} для
            привязки учётной записи к факультету и группе.
          </div>
        ) : (
          <>
            <div className="card rating-summary">
              <p>
                <strong>Факультет:</strong> {getFacultyLabel(faculty)}
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
                    <th>Группа</th>
                    <th>Заявлений</th>
                    <th>Сумма баллов</th>
                  </tr>
                </thead>
                <tbody>
                  {rating.rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        На факультете пока нет студентов с поданными достижениями
                      </td>
                    </tr>
                  ) : (
                    rating.rows.map((row) => (
                      <tr
                        key={row.student.id}
                        className={
                          row.student.id === user?.id ? 'data-table__row--self' : ''
                        }
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
                        <td>{row.student.group || '—'}</td>
                        <td>{row.applicationsCount}</td>
                        <td>
                          <strong>{row.totalScore}</strong>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
