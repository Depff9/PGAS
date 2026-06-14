import DashboardLayout from '../layouts/DashboardLayout';
import { commissionSidebar } from '../config/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setDirections } from '../store/dataSlice';
import { dataApi } from '../api/dataApi';

export default function AdminDirections() {
  const dispatch = useAppDispatch();
  const directions = useAppSelector((s) => s.data.directions);
  const [draftDirections, setDraftDirections] = useState(directions);
  const [requestError, setRequestError] = useState('');
  const [newDirection, setNewDirection] = useState({
    title: '',
    shortTitle: '',
    description: '',
  });
  const hasChanges = useMemo(
    () => JSON.stringify(draftDirections) !== JSON.stringify(directions),
    [draftDirections, directions]
  );
  useEffect(() => {
    setDraftDirections(directions);
  }, [directions]);

  const update = (id, field, value) => {
    setDraftDirections((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };

  const saveAll = async () => {
    setRequestError('');
    const changed = draftDirections.filter((d, idx) => {
      const current = directions[idx];
      return current && JSON.stringify(current) !== JSON.stringify(d);
    });
    try {
      for (const item of changed) {
        await dataApi.updateDirection(item.id, item);
      }
      dispatch(setDirections(draftDirections));
    } catch (error) {
      setRequestError(error.message || 'Не удалось сохранить направления');
    }
  };

  const resetDraft = () => {
    if (hasChanges && !confirm('Отменить несохраненные изменения в направлениях?')) return;
    setDraftDirections(directions);
  };
  const addDirection = async () => {
    setRequestError('');
    if (!newDirection.title.trim() || !newDirection.shortTitle.trim()) {
      setRequestError('Для нового направления заполните название и краткое название');
      return;
    }
    const payload = {
      id: `d${Date.now()}`,
      title: newDirection.title.trim(),
      shortTitle: newDirection.shortTitle.trim(),
      description: newDirection.description.trim(),
      active: true,
    };
    const created = await dataApi.createDirection(payload).catch((error) => {
      setRequestError(error.message || 'Не удалось добавить направление');
      return null;
    });
    if (!created?.id) return;
    dispatch(setDirections([...directions, created]));
    setNewDirection({ title: '', shortTitle: '', description: '' });
  };

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Кабинет комиссии">
      <header className="page-header">
        <h1>Направления ПГАС</h1>
        <p>Настройка пяти направлений подачи заявлений</p>
      </header>
      {requestError && <div className="alert alert--error">{requestError}</div>}
      <div className="form-actions" style={{ marginTop: 0, marginBottom: '1rem' }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={saveAll}
          disabled={!hasChanges}
        >
          Сохранить изменения
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={resetDraft}
          disabled={!hasChanges}
        >
          Отменить изменения
        </button>
      </div>
      <div className="card editor-block" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Добавить новое направление</h3>
        <div className="form-row form-row--2">
          <div className="form-group">
            <label>Название</label>
            <input
              value={newDirection.title}
              onChange={(e) => setNewDirection({ ...newDirection, title: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Краткое название</label>
            <input
              value={newDirection.shortTitle}
              onChange={(e) => setNewDirection({ ...newDirection, shortTitle: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Описание</label>
          <textarea
            value={newDirection.description}
            onChange={(e) => setNewDirection({ ...newDirection, description: e.target.value })}
            rows={2}
          />
        </div>
        <button type="button" className="btn btn--primary" onClick={addDirection}>
          Добавить направление
        </button>
      </div>

      {draftDirections.map((d, index) => (
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
