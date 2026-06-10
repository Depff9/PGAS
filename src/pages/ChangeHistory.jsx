import DashboardLayout from '../layouts/DashboardLayout';
import { adminSidebar, commissionSidebar } from '../config/navigation';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';
import { formatFullName } from '../mock/users';
import { getSubmissionAchievements } from '../utils/submissions';

const CATEGORY_LABELS = {
  regulations: 'Регламент',
  scoring: 'Уровни достижений',
  'admin.users': 'Пользователи',
  'commission.review': 'Обзор комиссии',
};

const SUBMISSION_STATUS_LABELS = {
  approved: 'Одобрено',
  rejected: 'Отклонено',
  revision: 'На доработке',
  submitted: 'Подано',
};

export default function ChangeHistory() {
  const user = useAppSelector((s) => s.auth.user);
  const history = useAppSelector((s) => s.data.history);
  const submissions = useAppSelector((s) => s.data.submissions);
  const achievements = useAppSelector((s) => s.data.achievements);
  const users = useAppSelector((s) => s.data.users);
  const sidebar = user?.role === ROLES.ADMIN ? adminSidebar : commissionSidebar;
  const title = user?.role === ROLES.ADMIN ? 'Администрирование' : 'Кабинет комиссии';
  const isAdmin = user?.role === ROLES.ADMIN;

  return (
    <DashboardLayout sidebarItems={sidebar} sidebarTitle={title}>
      <header className="page-header">
        <h1>{isAdmin ? 'Аудит действий' : 'Архив заявлений и действий комиссии'}</h1>
        <p>
          {isAdmin
            ? 'Все действия в системе администрирования и комиссии'
            : 'Поданные заявления студентов и действия члена комиссии'}
        </p>
      </header>

      {isAdmin ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Раздел</th>
                <th>Действие</th>
                <th>Кто</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    История пока пуста
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id}>
                    <td>{new Date(h.createdAt).toLocaleString('ru-RU')}</td>
                    <td>{CATEGORY_LABELS[h.category] || h.category}</td>
                    <td>{h.summary}</td>
                    <td>{h.userName || h.userId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Студент</th>
                <th>Достижений</th>
                <th>Статус заявления</th>
                <th>Действие комиссии</th>
              </tr>
            </thead>
            <tbody>
              {submissions.filter((s) => s.status !== 'draft').length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    Архив пока пуст
                  </td>
                </tr>
              ) : (
                submissions
                  .filter((s) => s.status !== 'draft')
                  .map((sub) => {
                    const student = users.find((u) => u.id === sub.userId);
                    const subHistory = history.find((h) => h.targetId === sub.id);
                    return (
                      <tr key={sub.id}>
                        <td>{new Date(sub.updatedAt || sub.createdAt).toLocaleString('ru-RU')}</td>
                        <td>{student ? formatFullName(student) : '—'}</td>
                        <td>{getSubmissionAchievements(achievements, sub.id).filter((a) => a.title).length}</td>
                        <td>{SUBMISSION_STATUS_LABELS[sub.status] || 'Подано'}</td>
                        <td>{subHistory?.summary || 'Проверка/оценка достижений'}</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
