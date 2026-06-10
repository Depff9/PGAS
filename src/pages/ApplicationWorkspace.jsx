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

  const [modal, setModal] = useState(null);

  const submission = useMemo(() => {
    let sub = getStudentSubmission(submissions, user?.id);
    if (!sub && user) sub = getOrCreateSubmission(submissions, user.id);
    return sub;
  }, [submissions, user]);

  const myAchievements = submission
    ? getSubmissionAchievements(achievements, submission.id)
    : [];

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

  const ensureSubmission = () => {
    if (submissions.find((s) => s.id === submission.id)) return submission;
    dispatch(setSubmissions([...submissions, submission]));
    return submission;
  };

  const openCell = (directionId, slotIndex) => {
    const sub = ensureSubmission();
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
    dispatch(
      setSubmissions(
        submissions.some((s) => s.id === synced.id)
          ? submissions.map((s) => (s.id === synced.id ? synced : s))
          : [...submissions, synced]
      )
    );
  };

  const handleSave = (item) => {
    const sub = ensureSubmission();
    const withScore = {
      ...item,
      submissionId: sub.id,
      userId: user.id,
      id: item.id || 'ach' + Date.now(),
      score: 0,
    };
    const next = upsertAchievement(myAchievements, withScore);
    persist(next, sub);
    setModal(null);
  };

  const handleDelete = () => {
    if (!modal?.achievement?.id) return;
    if (!confirm('Удалить достижение?')) return;
    const sub = ensureSubmission();
    const next = removeAchievement(myAchievements, modal.achievement.id);
    persist(next, sub);
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
                        const ach = getAchievementAt(
                          myAchievements,
                          submission.id,
                          d.id,
                          slot
                        );
                        return (
                          <td key={slot}>
                            <button
                              type="button"
                              className={cellClass(ach?.status)}
                              onClick={() => openCell(d.id, slot)}
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
          onDelete={modal.achievement.id ? handleDelete : null}
        />
      )}
    </div>
  );
}
