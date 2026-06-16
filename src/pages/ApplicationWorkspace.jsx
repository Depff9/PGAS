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
  isSubmissionLocked,
} from '../utils/submissions';
import { getCurrentAcademicYear, getCurrentSemesterLabel } from '../constants/submissions';
import { getCurrentSubmissionPeriod } from '../utils/submissionPeriod';
import { isSameAcademicYear } from '../utils/academicYear';
import { dataApi } from '../api/dataApi';
import {
  getActiveDeadlineLabel,
  isDeadlineReached as isSubmissionDeadlineReached,
} from '../utils/submissionDeadlines';

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

  const academicYear = getCurrentAcademicYear();
  const period = getCurrentSubmissionPeriod(regulations);
  const semesterLabel = getCurrentSemesterLabel(regulations);

  const submission = useMemo(() => {
    let sub = getStudentSubmission(submissions, user?.id, academicYear, period, regulations);
    if (!sub && user) sub = getOrCreateSubmission(submissions, user.id, academicYear, regulations);
    return sub;
  }, [submissions, user, academicYear, period, regulations]);

  const myAchievements = submission?.id
    ? getSubmissionAchievements(achievements, submission.id)
    : [];
  const isDeadlineReached = isSubmissionDeadlineReached(deadlineIso);
  const submissionLocked = isSubmissionLocked(submission);
  const canEdit = !isDeadlineReached && !submissionLocked;
  const deadlineLabel = getActiveDeadlineLabel(regulations);

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
    const existing = getStudentSubmission(submissions, user.id, academicYear, period, regulations);
    if (existing?.id && submissions.some((s) => s.id === existing.id)) {
      return existing;
    }
    const created = await dataApi.createSubmission({
      academicYear,
      period,
      status: 'draft',
    });
    const withoutDuplicate = submissions.filter(
      (s) =>
        !(
          s.userId === user.id &&
          (s.period || 'summer') === period &&
          isSameAcademicYear(s.academicYear, academicYear)
        )
    );
    dispatch(setSubmissions([...withoutDuplicate, created]));
    return created;
  };

  const openCell = async (directionId, slotIndex) => {
    if (!canEdit) {
      alert(
        submissionLocked
          ? 'Заявление уже подано. Редактирование доступно только после возврата на доработку.'
          : 'Окончание сроков подачи наступило. Изменение достижений недоступно.'
      );
      return;
    }
    try {
      const sub = await ensureSubmission();
      const existing = getAchievementAt(
        getSubmissionAchievements(achievements, sub.id),
        sub.id,
        directionId,
        slotIndex
      );
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
          score: null,
          finalScore: null,
          revision: null,
        },
        direction,
      });
    } catch (error) {
      setRequestError(error.message || 'Не удалось открыть форму достижения');
    }
  };

  const handleSave = async (item) => {
    if (!canEdit) return;
    setRequestError('');
    const sub = await ensureSubmission();
    const currentList = getSubmissionAchievements(achievements, sub.id);
    const existing = currentList.find((a) => a.id === item.id);

    const payload = {
      submissionId: sub.id,
      directionId: item.directionId,
      slotIndex: item.slotIndex,
      title: item.title,
      description: item.description,
      achievementLevel: item.achievementLevel,
      attachments: item.attachments,
      status: ACHIEVEMENT_STATUS.DRAFT,
    };

    let saved;
    if (existing?.id) {
      saved = await dataApi.updateAchievement(existing.id, payload);
    } else {
      saved = await dataApi.createAchievement(payload);
    }

    const other = achievements.filter((a) => a.submissionId !== sub.id);
    const next = upsertAchievement(currentList, saved);
    dispatch(setAchievements([...other, ...next]));
    setModal(null);
  };

  const handleDelete = async () => {
    if (!canEdit || !modal?.achievement?.id) return;
    if (!confirm('Удалить достижение?')) return;
    setRequestError('');
    try {
      const sub = await ensureSubmission();
      await dataApi.deleteAchievement(modal.achievement.id);
      const currentList = getSubmissionAchievements(achievements, sub.id);
      const next = removeAchievement(currentList, modal.achievement.id);
      const other = achievements.filter((a) => a.submissionId !== sub.id);
      dispatch(setAchievements([...other, ...next]));
      setModal(null);
    } catch (error) {
      setRequestError(error.message || 'Не удалось удалить достижение');
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="container page-content">
        <header className="page-header">
          <h1>Таблица достижений</h1>
          <p>
            Заявление на ПГАС · {semesterLabel}. Лимиты по направлениям — в{' '}
            <Link to="/regulations">регламенте</Link>.
          </p>
        </header>

        {submissionLocked && (
          <div className="alert alert--info">
            Заявление подано. Добавляйте и редактируйте достижения только если комиссия вернула
            заявление на доработку.
          </div>
        )}

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
                        const ach = submission?.id
                          ? getAchievementAt(myAchievements, submission.id, d.id, slot)
                          : null;
                        return (
                          <td key={slot}>
                            <button
                              type="button"
                              className={cellClass(ach?.status)}
                              onClick={() => openCell(d.id, slot)}
                              disabled={!canEdit && !ach}
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
          regulations={regulations}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={canEdit && modal.achievement.id ? handleDelete : null}
        />
      )}
    </div>
  );
}
