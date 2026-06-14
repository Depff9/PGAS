import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAppSelector } from '../store/hooks';
import { buildOverallRating, getStudentTotalScore } from '../utils/rating';
import { findFaculty, getFacultyLabel } from '../mock/faculties';
import { ROLES } from '../mock/users';
import { UNIVERSITY } from '../config/university';
import SortableHeader from '../components/SortableHeader';
import { sortBySelectors, toggleSortState } from '../utils/tableSort';
import { fetchRatingRows } from '../api/dataApi';

export default function Rating() {
  const user = useAppSelector((s) => s.auth.user);
  const users = useAppSelector((s) => s.data.users);
  const achievements = useAppSelector((s) => s.data.achievements);
  const faculties = useAppSelector((s) => s.data.faculties);
  const submissions = useAppSelector((s) => s.data.submissions);
  const [serverRows, setServerRows] = useState(null);
  const [ratingError, setRatingError] = useState('');

  const facultyId = user?.facultyId;
  const faculty = findFaculty(faculties, facultyId);
  const [sortState, setSortState] = useState({ key: 'totalScore', dir: 'desc' });
  const [facultyFilter, setFacultyFilter] = useState('all');

  useEffect(() => {
    let alive = true;
    if (user?.role !== ROLES.STUDENT) {
      setServerRows(null);
      setRatingError('');
      return () => {
        alive = false;
      };
    }
    fetchRatingRows()
      .then((rows) => {
        if (!alive) return;
        setServerRows(Array.isArray(rows) ? rows : []);
        setRatingError('');
      })
      .catch(() => {
        if (!alive) return;
        setRatingError('Не удалось загрузить рейтинг с сервера');
      });
    return () => {
      alive = false;
    };
  }, [user?.role]);

  const ratingRows = useMemo(() => {
    if (user?.role === ROLES.STUDENT && serverRows === null && !ratingError) {
      return [];
    }
    const base =
      user?.role === ROLES.STUDENT && serverRows
        ? serverRows.map((row) => {
            const student =
              users.find((u) => u.id === row.userId) ||
              submissions.find((s) => s.userId === row.userId)?.user || {
                id: row.userId,
                role: ROLES.STUDENT,
                facultyId: row.facultyId,
                group: row.group,
                lastName: '',
                firstName: '',
                middleName: null,
              };
            const faculty = findFaculty(faculties, row.facultyId);
            return {
              place: row.place,
              student,
              fullName: row.fullName,
              facultyLabel: faculty ? getFacultyLabel(faculty) : '—',
              achievementsCount: row.achievementsCount,
              totalScore: row.totalScore,
            };
          })
        : buildOverallRating(users, achievements, faculties, submissions);
    const filtered =
      facultyFilter === 'all'
        ? base
        : base.filter((row) => row.student.facultyId === facultyFilter);
    return sortBySelectors(filtered, sortState, {
      place: (row) => row.place,
      fullName: (row) => row.fullName,
      facultyLabel: (row) => row.facultyLabel,
      group: (row) => row.student.group || '',
      achievementsCount: (row) => row.achievementsCount,
      totalScore: (row) => row.totalScore,
    });
  }, [users, achievements, faculties, submissions, sortState, facultyFilter, serverRows, user?.role, ratingError]);

  const myRow =
    user?.role === ROLES.STUDENT && Array.isArray(serverRows)
      ? serverRows.find((row) => row.userId === user.id)
      : null;
  const myScore =
    user?.role === ROLES.STUDENT
      ? myRow?.totalScore ??
        (ratingError ? getStudentTotalScore(user.id, achievements, submissions) : 0)
      : 0;
  const myPlace = myRow?.place;

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
        {ratingError && <div className="alert alert--warning">{ratingError}</div>}

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
          <div className="form-group" style={{ maxWidth: 340, marginTop: '0.8rem' }}>
            <label>Фильтр по факультету</label>
            <select value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)}>
              <option value="all">Все факультеты</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {getFacultyLabel(f)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-wrap" style={{ marginTop: '1rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>
                  <SortableHeader
                    label="Место"
                    sortKey="place"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key, 'asc'))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Студент"
                    sortKey="fullName"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key, 'asc'))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Факультет"
                    sortKey="facultyLabel"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key, 'asc'))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Группа"
                    sortKey="group"
                    sortState={sortState}
                    onToggle={(key) => setSortState(toggleSortState(sortState, key, 'asc'))}
                  />
                </th>
                <th>
                  <SortableHeader
                    label="Достижений"
                    sortKey="achievementsCount"
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
              </tr>
            </thead>
            <tbody>
              {ratingRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    {user?.role === ROLES.STUDENT && serverRows === null && !ratingError
                      ? 'Загрузка рейтинга...'
                      : 'Пока нет студентов с поданными достижениями'}
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
