import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import AchievementReviewModal from '../components/AchievementReviewModal';
import { commissionSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setAchievements, setHistory, setNotifications, setSubmissions } from '../store/dataSlice';
import { formatFullName } from '../mock/users';
import {
  getSubmissionAchievements,
  getSubmissionTotalScore,
  getDirectionLimit,
  syncSubmissionFromAchievements,
  isHistoricalSubmission,
} from '../utils/submissions';
import { ACHIEVEMENT_STATUS_LABELS } from '../constants/achievements';
import {
  appendNotification,
  buildStatusNotification,
  shouldNotifyStatus,
} from '../utils/notifications';
import { getEffectiveScore } from '../utils/scoring';
import { SUBMISSION_STATUS_LABELS } from '../constants/submissions';
import { createHistoryEntry } from '../utils/history';
import { dataApi } from '../api/dataApi';
import { SUBMISSION_STATUS } from '../constants/submissions';
import { ACHIEVEMENT_STATUS } from '../constants/achievements';

export default function SubmissionReview() {
  const { submissionId } = useParams();
  const [searchParams] = useSearchParams();
  const archiveMode = searchParams.get('archive') === '1';
  const dispatch = useAppDispatch();
  const submissions = useAppSelector((s) => s.data.submissions);
  const achievements = useAppSelector((s) => s.data.achievements);
  const users = useAppSelector((s) => s.data.users);
  const directions = useAppSelector((s) => s.data.directions);
  const regulations = useAppSelector((s) => s.data.regulations);
  const notifications = useAppSelector((s) => s.data.notifications);
  const user = useAppSelector((s) => s.auth.user);
  const allowedDirections = user?.permissions?.allowedDirectionIds || [];
  const history = useAppSelector((s) => s.data.history);

  const submission = submissions.find((s) => s.id === submissionId);
  const student = users.find((u) => u.id === submission?.userId);
  const subAch = submission
    ? getSubmissionAchievements(achievements, submission.id).filter((a) => a.title)
    : [];
  const isHistorical = isHistoricalSubmission(submission);
  const readOnly = archiveMode && isHistorical;

  const [reviewId, setReviewId] = useState(null);
  const reviewAch = subAch.find((a) => a.id === reviewId);
  const reviewDir = directions.find((d) => d.id === reviewAch?.directionId);

  const visibleDirections = directions.filter((d) => {
    const dirAch = subAch.filter((a) => a.directionId === d.id);
    if (dirAch.length === 0) return false;
    if (archiveMode) return true;
    return d.active && (allowedDirections.length === 0 || allowedDirections.includes(d.id));
  });

  const canReviewDirection = (directionId) => {
    if (readOnly) return false;
    if (archiveMode) {
      return allowedDirections.length === 0 || allowedDirections.includes(directionId);
    }
    return allowedDirections.length === 0 || allowedDirections.includes(directionId);
  };

  if (!submission || !student) {
    return (
      <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Кабинет комиссии">
        <div className="alert alert--error">Заявление не найдено</div>
        <Link to={archiveMode ? '/commission/history' : '/commission/applications'}>
          ← Назад
        </Link>
      </DashboardLayout>
    );
  }

  const saveAch = async (updated) => {
    const historyEntry = createHistoryEntry({
      category: 'commission.review',
      action: 'review',
      summary: `Проверено достижение "${updated.title}" (${ACHIEVEMENT_STATUS_LABELS[updated.status]})`,
      userId: user.id,
      userName: formatFullName(user),
      targetId: submission.id,
      metadata: { achievementId: updated.id, status: updated.status },
    });
    const merged = achievements.map((a) => (a.id === updated.id ? updated : a));
    const hasSubmittedAchievements = merged
      .filter((a) => a.submissionId === submission.id && a.title)
      .some((a) => a.status === ACHIEVEMENT_STATUS.SUBMITTED);
    dispatch(setAchievements(merged));
    const synced = syncSubmissionFromAchievements(
      {
        ...submission,
        status:
          submission.status === SUBMISSION_STATUS.DRAFT || hasSubmittedAchievements
            ? SUBMISSION_STATUS.SUBMITTED
            : submission.status,
      },
      merged
    );
    dispatch(setSubmissions(submissions.map((s) => (s.id === synced.id ? synced : s))));
    dispatch(setHistory([historyEntry, ...history]));
    await dataApi.saveHistoryEntry(historyEntry).catch(() => null);
    if (shouldNotifyStatus(updated.status)) {
      const dirTitle = directions.find((d) => d.id === updated.directionId)?.title;
      const notification = buildStatusNotification(updated, updated.userId, dirTitle);
      if (notification) {
        dispatch(setNotifications(appendNotification(notifications, notification)));
        await dataApi.createNotification(notification).catch(() => null);
      }
    }
    await dataApi
      .updateAchievement(updated.id, {
        status: updated.status,
        score: updated.score,
        finalScore: updated.finalScore,
        revision: updated.revision,
      })
      .catch(() => null);
    await dataApi.updateSubmissionStatus(submission.id, synced.status).catch(() => null);
  };

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Кабинет комиссии">
      <Link
        to={archiveMode ? '/commission/history' : '/commission/applications'}
        className="btn btn--ghost btn--sm"
      >
        ← {archiveMode ? 'К архиву' : 'Все заявления'}
      </Link>

      <header className="page-header">
        <h1>Заявление: {formatFullName(student)}</h1>
        <p>
          {student.group} · {submission.academicYear} ·{' '}
          {SUBMISSION_STATUS_LABELS[submission.status]} · Сумма:{' '}
          {getSubmissionTotalScore(subAch)} баллов
        </p>
      </header>

      {readOnly && (
        <div className="alert alert--info">
          Архивное заявление прошлого периода — только просмотр, переоценка недоступна.
        </div>
      )}

      {archiveMode && !readOnly && (
        <div className="alert alert--info">
          Открыто из архива. Оценка доступна только по направлениям, разрешённым для вашей учётной
          записи.
        </div>
      )}

      {visibleDirections.map((d) => {
        const max = getDirectionLimit(regulations, d.id);
        const dirAch = subAch.filter((a) => a.directionId === d.id);
        const canReview = canReviewDirection(d.id);
        return (
          <div key={d.id} className="card editor-block">
            <h3>
              {d.title}{' '}
              {!d.active && archiveMode ? (
                <span className="form-hint">(направление неактивно)</span>
              ) : (
                <span className="form-hint">(лимит {max})</span>
              )}
            </h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Достижение</th>
                  <th>Баллы</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {dirAch.map((a) => (
                  <tr key={a.id}>
                    <td>{(a.slotIndex ?? 0) + 1}</td>
                    <td>{a.title}</td>
                    <td>{getEffectiveScore(a)}</td>
                    <td>
                      <span className={`badge badge--${a.status}`}>
                        {ACHIEVEMENT_STATUS_LABELS[a.status]}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        onClick={() => setReviewId(a.id)}
                      >
                        {canReview ? 'Рассмотреть' : 'Просмотр'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {reviewAch && (
        <AchievementReviewModal
          achievement={reviewAch}
          student={student}
          direction={reviewDir}
          readOnly={!canReviewDirection(reviewAch.directionId)}
          onClose={() => setReviewId(null)}
          onSave={saveAch}
        />
      )}

      {visibleDirections.length === 0 && (
        <div className="empty-state card">В этом заявлении нет заполненных достижений.</div>
      )}
    </DashboardLayout>
  );
}
