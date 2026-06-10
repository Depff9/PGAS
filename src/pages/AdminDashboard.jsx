import DashboardLayout from '../layouts/DashboardLayout';
import DashboardCard from '../components/DashboardCard';
import { adminSidebar } from '../config/navigation';
import { useAppSelector } from '../store/hooks';
import { ROLES } from '../mock/users';

export default function AdminDashboard() {
  const users = useAppSelector((s) => s.data.users);
  const faculties = useAppSelector((s) => s.data.faculties);
  const groups = useAppSelector((s) => s.data.groups);
  const commission = users.filter((u) => u.role === ROLES.COMMISSION).length;
  const tooltips = useAppSelector((s) => s.data.tooltips);

  const students = users.filter((u) => u.role === ROLES.STUDENT).length;

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
          to="/admin/faculties"
          icon="🏛"
          value={faculties.length}
          title="Факультетов"
          subtitle="в справочнике системы"
        />
        <DashboardCard
          to="/admin/groups"
          icon="📚"
          value={groups.length}
          title="Учебных групп"
          subtitle="актуальные группы по факультетам"
        />
        <DashboardCard
          to="/admin/tooltips"
          icon="💡"
          value={tooltips.length}
          title="Подсказки"
          subtitle="Тултипы интерфейса"
        />
        <DashboardCard
          to="/admin/users"
          icon="🧑‍⚖️"
          value={commission}
          title="Членов комиссии"
          subtitle="права и зоны оценки"
        />
      </div>
    </DashboardLayout>
  );
}
