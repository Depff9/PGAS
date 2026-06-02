import DashboardLayout from '../layouts/DashboardLayout';
import DashboardCard from '../components/DashboardCard';
import { commissionSidebar } from '../config/navigation';
import { useAppSelector } from '../store/hooks';
import { ACHIEVEMENT_STATUS } from '../constants/achievements';

export default function ComissionDashboard() {
  const achievements = useAppSelector((s) => s.data.achievements);
  const directions = useAppSelector((s) => s.data.directions);
  const regulations = useAppSelector((s) => s.data.regulations);

  const pending = achievements.filter(
    (a) => a.status === ACHIEVEMENT_STATUS.SUBMITTED
  ).length;

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Комиссия">
      <header className="page-header">
        <h1>Кабинет комиссии</h1>
        <p>Регламент, направления, рассмотрение достижений и экспорт ведомости</p>
      </header>

      <div className="grid-2">
        <DashboardCard
          to="/commission/applications"
          icon="📋"
          value={pending}
          title="На проверке"
          subtitle={`Всего записей: ${achievements.length}`}
        />
        <DashboardCard
          to="/commission/regulations"
          icon="📜"
          value={regulations.sections?.length || 0}
          title="Регламент"
          subtitle="Правила подачи"
        />
        <DashboardCard
          to="/commission/directions"
          icon="🎯"
          value={directions.length}
          title="Направления"
          subtitle="5 направлений ПГАС"
        />
        <DashboardCard
          to="/commission/export"
          icon="📥"
          title="Экспорт"
          subtitle="Excel / PDF"
        />
      </div>
    </DashboardLayout>
  );
}
