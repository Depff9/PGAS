import DashboardLayout from '../layouts/DashboardLayout';
import { commissionSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setDirections } from '../store/dataSlice';

export default function AdminDirections() {
  const dispatch = useAppDispatch();
  const directions = useAppSelector((s) => s.data.directions);

  const update = (id, field, value) => {
    dispatch(
      setDirections(
        directions.map((d) => (d.id === id ? { ...d, [field]: value } : d))
      )
    );
  };

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Комиссия">
      <header className="page-header">
        <h1>Направления ПГАС</h1>
        <p>Настройка пяти направлений подачи заявлений и максимальных баллов</p>
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
          <div className="form-row form-row--2">
            <div className="form-group">
              <label>Краткое название</label>
              <input
                value={d.shortTitle}
                onChange={(e) => update(d.id, 'shortTitle', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Макс. балл</label>
              <input
                type="number"
                value={d.maxScore}
                onChange={(e) => update(d.id, 'maxScore', Number(e.target.value))}
              />
            </div>
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
