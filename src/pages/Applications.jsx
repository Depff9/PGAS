import { Link } from 'react-router-dom';
import { useState } from 'react';
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
import { dataApi } from '../api/dataApi';

function getDeadlineLabel(regulations) {
  const section = regulations?.sections?.find((s) => s.id === 'r2');
  const content = section?.content || '';
  const winter = content.match(/зимней[^—-]*[—-]\s*до\s*([^,.;]+)/i)?.[1]?.trim();
  const summer = content.match(/летней[^—-]*[—-]\s*до\s*([^,.;]+)/i)?.[1]?.trim();
  if (winter && summer) return `${winter} / ${summer}`;
  const explicit = content.match(/до\s+(\d{1,2}\s+\S+)/i)?.[1];
  if (explicit) return explicit;
  const allDates = [...content.matchAll(/(\d{1,2}\s+\S+)/g)].map((m) => m[1]);
  return allDates.at(-1) || 'даты из регламента';
}

export default function Applications() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const submissions = useAppSelector((s) => s.data.submissions);
  const achievements = useAppSelector((s) => s.data.achievements);
  const directions = useAppSelector((s) => s.data.directions);
  const regulations = useAppSelector((s) => s.data.regulations);
  const deadlineIso = useAppSelector((s) => s.data.meta?.deadlineIso);
  const [requestError, setRequestError] = useState('');

  let submission = getStudentSubmission(submissions, user?.id);
  if (!submission && user) {
    submission = getOrCreateSubmission(submissions, user.id);
  }

  const subAch = submission
    ? getSubmissionAchievements(achievements, submission.id)
    : [];
  const isDeadlineReached = deadlineIso ? new Date(deadlineIso).getTime() < Date.now() : false;
  const deadlineLabel = getDeadlineLabel(regulations);
  const filled = countFilledAchievements(subAch);
  const totalScore = getSubmissionTotalScore(subAch);

  const byDirection = directions.map((d) => ({
    direction: d,
    count: subAch.filter((a) => a.directionId === d.id && a.title).length,
  }));

  const submitApplication = async () => {
    setRequestError('');
    if (isDeadlineReached) {
      alert('Окончание сроков подачи наступило. Отправка заявления недоступна.');
      return;
    }
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
    const synced = syncSubmissionFromAchievements(
      { ...submission, submittedAt: new Date().toISOString(), status: SUBMISSION_STATUS.SUBMITTED },
      [...otherAch, ...updatedAch]
    );
    synced.status = SUBMISSION_STATUS.SUBMITTED;
    synced.submittedAt = new Date().toISOString();
    try {
      await dataApi.submitOwnSubmission(synced.id);
    } catch (error) {
      setRequestError(error.message || 'Не удалось подать заявление');
      return;
    }
    dispatch(setAchievements([...otherAch, ...updatedAch]));
    dispatch(
      setSubmissions(
        submissions.some((s) => s.id === synced.id)
          ? submissions.map((s) => (s.id === synced.id ? synced : s))
          : [...submissions, synced]
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

        {isDeadlineReached && (
          <div className="alert alert--warning">
            Окончание сроков подачи ({deadlineLabel}) наступило. Новые отправки недоступны.
          </div>
        )}
        {requestError && <div className="alert alert--error">{requestError}</div>}

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
            {submission?.status === SUBMISSION_STATUS.DRAFT && !isDeadlineReached && (
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
