import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSubmissions, setAchievements } from '../store/dataSlice';
import {
  SUBMISSION_STATUS_LABELS,
  CURRENT_SEMESTER_LABEL,
} from '../constants/submissions';
import { ACHIEVEMENT_STATUS_LABELS } from '../constants/achievements';
import {
  getOrCreateSubmission,
  getStudentSubmission,
  getSubmissionAchievements,
  getSubmissionTotalScore,
  countFilledAchievements,
  syncSubmissionFromAchievements,
} from '../utils/submissions';
import { SUBMISSION_STATUS } from '../constants/submissions';

export default function Applications() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const submissions = useAppSelector((s) => s.data.submissions);
  const achievements = useAppSelector((s) => s.data.achievements);
  const directions = useAppSelector((s) => s.data.directions);

  let submission = getStudentSubmission(submissions, user?.id);
  if (!submission && user) {
    submission = getOrCreateSubmission(submissions, user.id);
    if (!submissions.find((s) => s.id === submission.id)) {
      dispatch(setSubmissions([...submissions, submission]));
    }
  }

  const subAch = submission
    ? getSubmissionAchievements(achievements, submission.id)
    : [];
  const filled = countFilledAchievements(subAch);
  const totalScore = getSubmissionTotalScore(subAch);

  const byDirection = directions.map((d) => ({
    direction: d,
    count: subAch.filter((a) => a.directionId === d.id && a.title).length,
  }));

  const submitApplication = () => {
    if (filled === 0) {
      alert('Добавьте хотя бы одно достижение в таблице');
      return;
    }
    const updatedAch = subAch.map((a) =>
      a.status === 'draft' && a.title
        ? { ...a, status: 'submitted', updatedAt: new Date().toISOString() }
        : a
    );
    const otherAch = achievements.filter((a) => a.submissionId !== submission.id);
    dispatch(setAchievements([...otherAch, ...updatedAch]));
    const synced = syncSubmissionFromAchievements(
      { ...submission, submittedAt: new Date().toISOString() },
      [...otherAch, ...updatedAch]
    );
    dispatch(
      setSubmissions(
        submissions.map((s) => (s.id === synced.id ? synced : s))
      )
    );
    alert('Заявление на ПГАС подано');
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container page-content">
        <header className="page-header">
          <h1>Моё заявление на ПГАС</h1>
          <p>
            Одно заявление на повышенную стипендию за {CURRENT_SEMESTER_LABEL}.
            Внутри — достижения по направлениям.
          </p>
        </header>

        <div className="card submission-card">
          <div className="submission-card__head">
            <div>
              <h2 style={{ margin: 0 }}>Заявление на ПГАС</h2>
              <p className="form-hint">Семестр: {CURRENT_SEMESTER_LABEL}</p>
            </div>
            <span className={`badge badge--${submission?.status || 'draft'}`}>
              {SUBMISSION_STATUS_LABELS[submission?.status] || 'Черновик'}
            </span>
          </div>

          <dl className="profile-meta submission-card__stats">
            <dt>Достижений заполнено</dt>
            <dd>{filled}</dd>
            <dt>Сумма баллов</dt>
            <dd>{totalScore}</dd>
            {submission?.submittedAt && (
              <>
                <dt>Дата подачи</dt>
                <dd>{new Date(submission.submittedAt).toLocaleString('ru-RU')}</dd>
              </>
            )}
          </dl>

          <h3>По направлениям</h3>
          <ul className="submission-directions-list">
            {byDirection.map(({ direction, count }) => (
              <li key={direction.id}>
                <strong>{direction.shortTitle || direction.title}</strong> — {count}{' '}
                достиж.
              </li>
            ))}
          </ul>

          {filled > 0 && (
            <div className="table-wrap" style={{ marginTop: '1rem' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Направление</th>
                    <th>№</th>
                    <th>Название</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {subAch
                    .filter((a) => a.title)
                    .map((a) => {
                      const dir = directions.find((d) => d.id === a.directionId);
                      return (
                        <tr key={a.id}>
                          <td>{dir?.shortTitle}</td>
                          <td>{(a.slotIndex ?? 0) + 1}</td>
                          <td>{a.title}</td>
                          <td>
                            <span className={`badge badge--${a.status}`}>
                              {ACHIEVEMENT_STATUS_LABELS[a.status]}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions">
            <Link to="/application/workspace" className="btn btn--primary">
              Открыть таблицу достижений
            </Link>
            {submission?.status === SUBMISSION_STATUS.DRAFT && (
              <button type="button" className="btn btn--ghost" onClick={submitApplication}>
                Подать заявление
              </button>
            )}
            <Link to="/rating" className="btn btn--ghost">
              Рейтинг
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
