import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { commissionSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setScoringMatrix, setHistory } from '../store/dataSlice';
import { createHistoryEntry } from '../utils/history';
import { formatFullName } from '../mock/users';

export default function ScoringMatrix() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const matrix = useAppSelector((s) => s.data.scoringMatrix);
  const history = useAppSelector((s) => s.data.history);
  const [local, setLocal] = useState(matrix);
  const [saved, setSaved] = useState(false);

  const updateLevel = (id, field, value) => {
    setLocal({
      ...local,
      levels: local.levels.map((l) =>
        l.id === id ? { ...l, [field]: field === 'points' ? Number(value) : value } : l
      ),
    });
  };

  const updateBonus = (index, field, value) => {
    const bonuses = [...local.descriptionBonuses];
    bonuses[index] = {
      ...bonuses[index],
      [field]: field === 'points' || field === 'minLength' ? Number(value) : value,
    };
    setLocal({ ...local, descriptionBonuses: bonuses });
  };

  const save = () => {
    const payload = { ...local, updatedAt: new Date().toISOString() };
    dispatch(setScoringMatrix(payload));
    dispatch(
      setHistory([
        createHistoryEntry({
          category: 'scoring',
          action: 'update',
          summary: 'Обновлена матрица баллов',
          userId: user.id,
          userName: formatFullName(user),
          snapshot: payload,
        }),
        ...history,
      ])
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Комиссия">
      <header className="page-header">
        <h1>Матрица баллов</h1>
        <p>Настройка уровней достижений и бонусов за полноту описания</p>
      </header>

      {saved && <div className="alert alert--success">Матрица сохранена</div>}

      <div className="card editor-block">
        <h3 style={{ marginTop: 0 }}>Уровни мероприятий</h3>
        {local.levels.map((l) => (
          <div key={l.id} className="form-row form-row--2" style={{ marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label>{l.id}</label>
              <input
                value={l.label}
                onChange={(e) => updateLevel(l.id, 'label', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Баллы</label>
              <input
                type="number"
                value={l.points}
                onChange={(e) => updateLevel(l.id, 'points', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="card editor-block">
        <h3 style={{ marginTop: 0 }}>Бонусы за описание</h3>
        {local.descriptionBonuses.map((b, i) => (
          <div key={i} className="form-row form-row--2" style={{ marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label>Мин. символов</label>
              <input
                type="number"
                value={b.minLength}
                onChange={(e) => updateBonus(i, 'minLength', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>+ баллов</label>
              <input
                type="number"
                value={b.points}
                onChange={(e) => updateBonus(i, 'points', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn--primary" onClick={save}>
        Сохранить матрицу
      </button>
    </DashboardLayout>
  );
}
