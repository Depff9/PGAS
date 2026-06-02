import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminSidebar } from '../config/navigation';
import { TOOLTIP_FIELD_KEYS } from '../config/tooltipFields';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTooltips } from '../store/dataSlice';

export default function Tooltips() {
  const dispatch = useAppDispatch();
  const tooltips = useAppSelector((s) => s.data.tooltips);
  const [form, setForm] = useState({
    fieldKey: TOOLTIP_FIELD_KEYS[0].value,
    label: '',
    text: '',
  });

  const add = (e) => {
    e.preventDefault();
    const existing = tooltips.find((t) => t.fieldKey === form.fieldKey);
    if (existing) {
      dispatch(
        setTooltips(
          tooltips.map((t) =>
            t.fieldKey === form.fieldKey
              ? { ...t, label: form.label, text: form.text }
              : t
          )
        )
      );
    } else {
      dispatch(
        setTooltips([
          ...tooltips,
          { id: 't' + Date.now(), ...form },
        ])
      );
    }
    setForm({ fieldKey: TOOLTIP_FIELD_KEYS[0].value, label: '', text: '' });
  };

  const remove = (id) => {
    dispatch(setTooltips(tooltips.filter((t) => t.id !== id)));
  };

  const edit = (t) => {
    setForm({ fieldKey: t.fieldKey, label: t.label, text: t.text });
  };

  return (
    <DashboardLayout sidebarItems={adminSidebar} sidebarTitle="Администрирование">
      <header className="page-header">
        <h1>Подсказки (тултипы)</h1>
        <p>
          Пояснения к полям и разделам — кнопка «?» рядом с подписью. Выберите элемент из
          списка.
        </p>
      </header>

      <div className="card editor-block">
        <h3 style={{ marginTop: 0 }}>Добавить или обновить подсказку</h3>
        <form onSubmit={add}>
          <div className="form-group">
            <label>Элемент интерфейса</label>
            <select
              value={form.fieldKey}
              onChange={(e) => setForm({ ...form, fieldKey: e.target.value })}
            >
              {TOOLTIP_FIELD_KEYS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Заголовок подсказки</label>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Текст подсказки</label>
            <textarea
              value={form.text}
              onChange={(e) => setForm({ ...form, text: e.target.value })}
              required
              rows={3}
            />
          </div>
          <button type="submit" className="btn btn--primary">
            Сохранить подсказку
          </button>
        </form>
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ключ</th>
              <th>Заголовок</th>
              <th>Текст</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tooltips.map((t) => (
              <tr key={t.id}>
                <td>
                  <code>{t.fieldKey}</code>
                </td>
                <td>{t.label}</td>
                <td>{t.text}</td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => edit(t)}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() => remove(t.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
