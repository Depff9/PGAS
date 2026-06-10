import DashboardLayout from '../layouts/DashboardLayout';
import { commissionSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setDirections } from '../store/dataSlice';
import { dataApi } from '../api/dataApi';

export default function AdminDirections() {
  const dispatch = useAppDispatch();
  const directions = useAppSelector((s) => s.data.directions);

  const update = async (id, field, value) => {
    const nextDirections = directions.map((d) => (d.id === id ? { ...d, [field]: value } : d));
    dispatch(
      setDirections(nextDirections)
    );
    const updated = nextDirections.find((d) => d.id === id);
    await dataApi.updateDirection(id, updated).catch(() => null);
  };

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Кабинет комиссии">
      <header className="page-header">
        <h1>Направления ПГАС</h1>
        <p>Настройка пяти направлений подачи заявлений</p>
      </header>

      {directions.map((d, index) => (
        <div key={d.id} className="editor-block">
          <div className="editor-block__head">
            <span className="editor-block__num">Направление {index + 1}</span>
          </div>
          <div className="form-group">
            <label>Название</label>
            <input
              value={d.title}
              onChange={(e) => update(d.id, 'title', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Краткое название</label>
            <input
              value={d.shortTitle}
              onChange={(e) => update(d.id, 'shortTitle', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={d.description}
              onChange={(e) => update(d.id, 'description', e.target.value)}
              rows={3}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={d.active}
              onChange={(e) => update(d.id, 'active', e.target.checked)}
            />
            Направление активно (доступно для подачи)
          </label>
        </div>
      ))}
    </DashboardLayout>
  );
}
