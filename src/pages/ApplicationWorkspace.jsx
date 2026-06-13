import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AchievementEditModal from '../components/AchievementEditModal';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAchievements, setSubmissions } from '../store/dataSlice';
import { ACHIEVEMENT_STATUS, ACHIEVEMENT_STATUS_LABELS } from '../constants/achievements';
import { getAchievementAt, upsertAchievement, removeAchievement } from '../utils/achievements';
import { UNIVERSITY } from '../config/university';
import {
  getOrCreateSubmission,
  getStudentSubmission,
  getSubmissionAchievements,
  getDirectionLimit,
  syncSubmissionFromAchievements,
} from '../utils/submissions';
import { CURRENT_ACADEMIC_YEAR } from '../constants/submissions';
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

function cellClass(status) {
  if (!status) return 'matrix-cell matrix-cell--empty';
  return `matrix-cell matrix-cell--${status}`;
}

export default function ApplicationWorkspace() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const achievements = useAppSelector((s) => s.data.achievements);
  const submissions = useAppSelector((s) => s.data.submissions);
  const directions = useAppSelector((s) => s.data.directions).filter((d) => d.active);
  const regulations = useAppSelector((s) => s.data.regulations);
  const deadlineIso = useAppSelector((s) => s.data.meta?.deadlineIso);

  const [modal, setModal] = useState(null);
  const [requestError, setRequestError] = useState('');

  const submission = useMemo(() => {
    let sub = getStudentSubmission(submissions, user?.id);
    if (!sub && user) sub = getOrCreateSubmission(submissions, user.id);
    return sub;
  }, [submissions, user]);

  const myAchievements = submission
    ? getSubmissionAchievements(achievements, submission.id)
    : [];
  const isDeadlineReached = deadlineIso ? new Date(deadlineIso).getTime() < Date.now() : false;
  const canEdit = !isDeadlineReached;
  const deadlineLabel = getDeadlineLabel(regulations);

  if (!user?.facultyId || !user?.group) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="container page-content">
          <div className="alert alert--info">
            Факультет и группа не назначены. Обратитесь к администратору {UNIVERSITY.shortName}.
          </div>
        </div>
      </div>
    );
  }

  const ensureSubmission = async () => {
    if (submissions.find((s) => s.id === submission.id)) return submission;
    const created = await dataApi.createSubmission({
      academicYear: CURRENT_ACADEMIC_YEAR,
      status: 'draft',
    });
    dispatch(setSubmissions([...submissions, created]));
    return created;
  };

  const openCell = async (directionId, slotIndex) => {
    if (!canEdit) {
      alert('Окончание сроков подачи наступило. Изменение достижений недоступно.');
      return;
    }
    const sub = await ensureSubmission();
    const existing = getAchievementAt(myAchievements, sub.id, directionId, slotIndex);
    const direction = directions.find((d) => d.id === directionId);
    setModal({
      achievement: existing || {
        id: null,
        submissionId: sub.id,
        userId: user.id,
        directionId,
        slotIndex,
        title: '',
        description: '',
        attachments: [],
        achievementLevel: 'faculty',
        status: ACHIEVEMENT_STATUS.DRAFT,
        score: 0,
        finalScore: null,
        revision: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      direction,
    });
  };

  const persist = (nextAchievements, sub) => {
    const other = achievements.filter((a) => a.submissionId !== sub.id);
    const merged = [...other, ...nextAchievements];
    dispatch(setAchievements(merged));
    const synced = syncSubmissionFromAchievements(sub, merged);
    dataApi.updateSubmissionStatus(synced.id, synced.status).catch(() => null);
    const prevSubmissions = submissions;
    dispatch(
      setSubmissions(
        prevSubmissions.some((s) => s.id === synced.id)
          ? prevSubmissions.map((s) => (s.id === synced.id ? synced : s))
          : [...prevSubmissions, synced]
      )
    );
  };

  const handleSave = async (item) => {
    if (!canEdit) return;
    setRequestError('');
    let sub = submission;
    try {
      sub = await ensureSubmission();
    } catch (error) {
      setRequestError(error.message || 'Не удалось создать заявление');
      return;
    }
    const existing = myAchievements.find((a) => a.id === item.id);
    const isNew = !existing;
    const existingSubmittedLocked = existing?.status === 'submitted';
    if (existingSubmittedLocked && item.status !== 'revision') {
      alert('Поданное достижение нельзя изменить до возврата на правки.');
      setModal(null);
      return;
    }
    const withScore = {
      ...item,
      submissionId: sub.id,
      userId: user.id,
      id: item.id || 'ach' + Date.now(),
      score: 0,
      status:
        existingSubmittedLocked && existing?.status === 'submitted'
          ? 'submitted'
          : item.status,
    };
    const next = upsertAchievement(myAchievements, withScore);
    persist(next, sub);
    if (!isNew && existingSubmittedLocked) {
      await dataApi.updateAchievement(item.id, withScore).catch(() => null);
    } else if (item.id) {
      await dataApi.updateAchievement(item.id, withScore);
    } else {
      await dataApi.createAchievement(withScore);
    }
    setModal(null);
  };

  const handleDelete = async () => {
    if (!canEdit) return;
    if (!modal?.achievement?.id) return;
    if (modal.achievement.status === 'submitted') {
      alert('Поданное достижение нельзя удалить до возврата на правки.');
      setModal(null);
      return;
    }
    if (!confirm('Удалить достижение?')) return;
    setRequestError('');
    let sub = submission;
    try {
      sub = await ensureSubmission();
    } catch (error) {
      setRequestError(error.message || 'Не удалось подготовить удаление');
      return;
    }
    const next = removeAchievement(myAchievements, modal.achievement.id);
    persist(next, sub);
    await dataApi.deleteAchievement(modal.achievement.id);
    setModal(null);
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container page-content">
        <header className="page-header">
          <h1>Таблица достижений</h1>
          <p>
            Заявление на ПГАС · {CURRENT_ACADEMIC_YEAR} семестр. Лимиты по направлениям — в{' '}
            <Link to="/regulations">регламенте</Link>.
          </p>
        </header>

        {isDeadlineReached && (
          <div className="alert alert--info">
            Окончание сроков подачи ({deadlineLabel}) наступило. Достижения зафиксированы и
            недоступны для изменения.
          </div>
        )}
        {requestError && <div className="alert alert--error">{requestError}</div>}

        <div className="form-actions" style={{ marginBottom: '1rem' }}>
          <Link to="/applications" className="btn btn--ghost btn--sm">
            ← Моё заявление
          </Link>
        </div>

        {directions.map((d) => {
          const maxSlots = getDirectionLimit(regulations, d.id);
          const slots = Array.from({ length: maxSlots }, (_, i) => i);
          return (
            <section key={d.id} className="matrix-section">
              <h2 className="matrix-section__title">
                {d.title}{' '}
                <span className="form-hint">(до {maxSlots} достижений)</span>
              </h2>
              <div className="table-wrap matrix-wrap">
                <table className="data-table matrix-table matrix-table--row">
                  <thead>
                    <tr>
                      {slots.map((slot) => (
                        <th key={slot}>№{slot + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {slots.map((slot) => {
                        const ach = submission
                          ? getAchievementAt(
                              myAchievements,
                              submission.id,
                              d.id,
                              slot
                            )
                          : null;
                        return (
                          <td key={slot}>
                            <button
                              type="button"
                              className={cellClass(ach?.status)}
                              onClick={() => openCell(d.id, slot)}
                              disabled={!canEdit}
                            >
                              {ach ? (
                                <>
                                  <span className="matrix-cell__title">{ach.title}</span>
                                  <span className="matrix-cell__meta">
                                    {ACHIEVEMENT_STATUS_LABELS[ach.status]}
                                  </span>
                                </>
                              ) : (
                                <span className="matrix-cell__add">+</span>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>

      {modal && (
        <AchievementEditModal
          achievement={modal.achievement}
          direction={modal.direction}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={canEdit && modal.achievement.id ? handleDelete : null}
        />
      )}
    </div>
  );
}
