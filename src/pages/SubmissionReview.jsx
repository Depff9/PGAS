import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

export default function SubmissionReview() {
  const { submissionId } = useParams();
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

  const [reviewId, setReviewId] = useState(null);
  const reviewAch = subAch.find((a) => a.id === reviewId);
  const reviewDir = directions.find((d) => d.id === reviewAch?.directionId);

  if (!submission || !student) {
    return (
      <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Кабинет комиссии">
        <div className="alert alert--error">Заявление не найдено</div>
        <Link to="/commission/applications">← К списку</Link>
      </DashboardLayout>
    );
  }

  const saveAch = async (updated) => {
    const merged = achievements.map((a) => (a.id === updated.id ? updated : a));
    dispatch(setAchievements(merged));
    const synced = syncSubmissionFromAchievements(submission, merged);
    dispatch(setSubmissions(submissions.map((s) => (s.id === synced.id ? synced : s))));
    dispatch(
      setHistory([
        createHistoryEntry({
          category: 'commission.review',
          action: 'update',
          summary: `Проверено достижение "${updated.title}" (${ACHIEVEMENT_STATUS_LABELS[updated.status]})`,
          userId: user.id,
          userName: formatFullName(user),
          targetId: submission.id,
          metadata: { achievementId: updated.id, status: updated.status },
        }),
        ...history,
      ])
    );
    if (shouldNotifyStatus(updated.status)) {
      const dirTitle = directions.find((d) => d.id === updated.directionId)?.title;
      dispatch(
        setNotifications(
          appendNotification(
            notifications,
            buildStatusNotification(updated, updated.userId, dirTitle)
          )
        )
      );
    }
    await dataApi.updateAchievement(updated.id, updated).catch(() => null);
    await dataApi.updateSubmissionStatus(submission.id, synced.status).catch(() => null);
  };

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Кабинет комиссии">
      <Link to="/commission/applications" className="btn btn--ghost btn--sm">
        ← Все заявления
      </Link>

      <header className="page-header">
        <h1>Заявление: {formatFullName(student)}</h1>
        <p>
          {student.group} · {SUBMISSION_STATUS_LABELS[submission.status]} · Сумма:{' '}
          {getSubmissionTotalScore(subAch)} баллов
        </p>
      </header>

      {directions
        .filter((d) => d.active && allowedDirections.includes(d.id))
        .map((d) => {
          const max = getDirectionLimit(regulations, d.id);
          const dirAch = subAch.filter((a) => a.directionId === d.id);
          if (dirAch.length === 0) return null;
          return (
            <div key={d.id} className="card editor-block">
              <h3>
                {d.title} <span className="form-hint">(лимит {max})</span>
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
                          Рассмотреть
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
          onClose={() => setReviewId(null)}
          onSave={saveAch}
        />
      )}

      {subAch.filter((a) => allowedDirections.includes(a.directionId)).length === 0 && (
        <div className="empty-state card">
          В этом заявлении нет достижений по направлениям, доступным вам для оценки.
        </div>
      )}
    </DashboardLayout>
  );
}
