import DashboardLayout from '../layouts/DashboardLayout';
import DashboardCard from '../components/DashboardCard';
import { adminSidebar } from '../config/navigation';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';
import { ACHIEVEMENT_STATUS } from '../constants/achievements';

export default function AdminDashboard() {
  const users = useAppSelector((s) => s.data.users);
  const achievements = useAppSelector((s) => s.data.achievements);
  const submissions = useAppSelector((s) => s.data.submissions);
  const tooltips = useAppSelector((s) => s.data.tooltips);

  const students = users.filter((u) => u.role === ROLES.STUDENT).length;
  const submittedSubs = submissions.filter((s) => s.status !== 'draft').length;
  const approvedAch = achievements.filter((a) => a.status === ACHIEVEMENT_STATUS.APPROVED).length;

  return (
    <DashboardLayout sidebarItems={adminSidebar} sidebarTitle="Администрирование">
      <header className="page-header">
        <h1>Панель администратора</h1>
        <p>Техническое сопровождение системы БрГУ (без доступа к работе комиссии)</p>
      </header>

      <div className="grid-2">
        <DashboardCard
          to="/admin/users"
          icon="👥"
          value={users.length}
          title="Пользователей"
          subtitle={`из них ${students} студентов`}
        />
        <DashboardCard
          icon="📋"
          value={submittedSubs}
          title="Подано заявлений"
          subtitle={`всего заявлений: ${submissions.length}`}
        />
        <DashboardCard
          icon="✅"
          value={approvedAch}
          title="Одобрено достижений"
          subtitle="в рамках заявлений"
        />
        <DashboardCard
          to="/admin/tooltips"
          icon="💡"
          value={tooltips.length}
          title="Подсказки"
          subtitle="Тултипы интерфейса"
        />
      </div>
    </DashboardLayout>
  );
}
