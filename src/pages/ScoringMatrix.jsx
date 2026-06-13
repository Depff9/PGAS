import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { commissionSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setScoringMatrix, setHistory } from '../store/dataSlice';
import { createHistoryEntry } from '../utils/history';
import { formatFullName } from '../mock/users';
import { dataApi } from '../api/dataApi';

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

  const save = async () => {
    const historyEntry = createHistoryEntry({
      category: 'scoring',
      action: 'update',
      summary: 'Обновлена матрица баллов',
      userId: user.id,
      userName: formatFullName(user),
    });
    const payload = { ...local, updatedAt: new Date().toISOString() };
    dispatch(setScoringMatrix(payload));
    await dataApi.updateScoringMatrix(payload).catch(() => null);
    dispatch(
      setHistory([
        { ...historyEntry, snapshot: payload },
        ...history,
      ])
    );
    await dataApi.saveHistoryEntry({ ...historyEntry, snapshot: payload }).catch(() => null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Кабинет комиссии">
      <header className="page-header">
        <h1>Уровни достижений</h1>
        <p>Справочник уровней без автоматического начисления баллов</p>
      </header>

      {saved && <div className="alert alert--success">Матрица сохранена</div>}

      <div className="card editor-block">
        <h3 style={{ marginTop: 0 }}>Уровни мероприятий</h3>
        {local.levels.map((l) => (
          <div key={l.id} className="form-row form-row--2" style={{ marginBottom: '0.75rem' }}>
            <div className="form-group">
              <label>Уровень</label>
              <input
                value={l.label}
                onChange={(e) => updateLevel(l.id, 'label', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Комментарий</label>
              <input value="Баллы выставляются комиссией вручную" disabled />
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
