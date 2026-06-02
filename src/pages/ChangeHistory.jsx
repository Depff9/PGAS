import DashboardLayout from '../layouts/DashboardLayout';
import { adminSidebar, commissionSidebar } from '../config/navigation';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';

const CATEGORY_LABELS = {
  regulations: 'Регламент',
  scoring: 'Матрица баллов',
};

export default function ChangeHistory() {
  const user = useAppSelector((s) => s.auth.user);
  const history = useAppSelector((s) => s.data.history);
  const sidebar = user?.role === ROLES.ADMIN ? adminSidebar : commissionSidebar;
  const title = user?.role === ROLES.ADMIN ? 'Администрирование' : 'Комиссия';

  return (
    <DashboardLayout sidebarItems={sidebar} sidebarTitle={title}>
      <header className="page-header">
        <h1>История изменений</h1>
        <p>Регламент и матрица баллов</p>
      </header>

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
    </DashboardLayout>
  );
}
