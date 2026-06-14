import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { adminSidebar } from '../config/navigation';
import { TOOLTIP_FIELD_KEYS } from '../config/tooltipFields';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTooltips } from '../store/dataSlice';
import TooltipInfo from '../components/TooltipInfo';
import { dataApi } from '../api/dataApi';

function PreviewField({ fieldKey }) {
  const fallback =
    TOOLTIP_FIELD_KEYS.find((k) => k.value === fieldKey)?.label || 'Элемент интерфейса';

  if (fieldKey === 'login.email') {
    return (
      <div className="tooltip-live-preview__field">
        <p className="form-hint" style={{ margin: '0 0 0.5rem' }}>
          Страница: Вход в систему
        </p>
        <label className="tooltip-live-preview__label">
          Email <TooltipInfo fieldKey={fieldKey} />
        </label>
        <input className="tooltip-live-preview__input" value="ivanov@student.brgu.ru" readOnly />
      </div>
    );
  }

  if (fieldKey === 'login.password') {
    return (
      <div className="tooltip-live-preview__field">
        <p className="form-hint" style={{ margin: '0 0 0.5rem' }}>
          Страница: Вход в систему
        </p>
        <label className="tooltip-live-preview__label">
          Пароль <TooltipInfo fieldKey={fieldKey} />
        </label>
        <input className="tooltip-live-preview__input" value="••••••••" readOnly />
      </div>
    );
  }

  if (fieldKey.startsWith('register.')) {
    return (
      <div className="tooltip-live-preview__field">
        <p className="form-hint" style={{ margin: '0 0 0.5rem' }}>
          Страница: Регистрация
        </p>
        <label className="tooltip-live-preview__label">
          {fieldKey.includes('lastName')
            ? 'Фамилия'
            : fieldKey.includes('firstName')
              ? 'Имя'
              : fieldKey.includes('middleName')
                ? 'Отчество'
                : fieldKey.includes('email')
                  ? 'Email'
                  : 'Пароль'}{' '}
          <TooltipInfo fieldKey={fieldKey} />
        </label>
        <input className="tooltip-live-preview__input" readOnly value="" />
      </div>
    );
  }

  if (fieldKey.startsWith('profile.')) {
    return (
      <div className="tooltip-live-preview__field">
        <p className="form-hint" style={{ margin: '0 0 0.5rem' }}>
          Страница: Профиль
        </p>
        <label className="tooltip-live-preview__label">
          {fieldKey.includes('lastName')
            ? 'Фамилия'
            : fieldKey.includes('firstName')
              ? 'Имя'
              : fieldKey.includes('middleName')
                ? 'Отчество'
                : fieldKey.includes('faculty')
                  ? 'Факультет'
                  : fieldKey.includes('group')
                    ? 'Группа'
                    : fieldKey.includes('recordBook')
                      ? 'Зачётная книжка'
                      : 'Студенческий билет'}{' '}
          <TooltipInfo fieldKey={fieldKey} />
        </label>
        <input className="tooltip-live-preview__input" readOnly value="" />
      </div>
    );
  }

  if (fieldKey.startsWith('home.')) {
    return (
      <div className="tooltip-live-preview__field">
        <p className="form-hint" style={{ margin: '0 0 0.5rem' }}>
          Страница: Главная
        </p>
        <label className="tooltip-live-preview__label">
          {fieldKey.includes('heroTitle')
            ? 'Заголовок главной'
            : fieldKey.includes('deadline')
              ? 'Срок подачи'
              : fieldKey.includes('goToSystem')
                ? 'Кнопка "Перейти в систему"'
                : 'Кнопка "Направления ПГАС"'}{' '}
          <TooltipInfo fieldKey={fieldKey} />
        </label>
        {fieldKey.includes('goTo') ? (
          <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'fit-content' }}>
            {fieldKey.includes('goToSystem') ? 'Перейти в систему' : 'Направления ПГАС'}
          </button>
        ) : (
          <input className="tooltip-live-preview__input" readOnly value="" />
        )}
      </div>
    );
  }

  if (fieldKey.startsWith('application.')) {
    return (
      <div className="tooltip-live-preview__field">
        <p className="form-hint" style={{ margin: '0 0 0.5rem' }}>
          Страница: Таблица достижений / модальное окно достижения
        </p>
        <label className="tooltip-live-preview__label">
          {fieldKey.includes('title')
            ? 'Название'
            : fieldKey.includes('description')
              ? 'Описание'
              : fieldKey.includes('attachments')
                ? 'Файлы (PDF, JPG, PNG)'
                : fieldKey.includes('level')
                  ? 'Уровень'
                  : fieldKey.includes('submit')
                    ? 'Кнопка отправки'
                    : fieldKey.includes('draft')
                      ? 'Кнопка черновика'
                      : 'Кнопка отмены'}{' '}
          <TooltipInfo fieldKey={fieldKey} />
        </label>
        {fieldKey.includes('submit') || fieldKey.includes('draft') || fieldKey.includes('cancel') ? (
          <button type="button" className="btn btn--ghost btn--sm" style={{ width: 'fit-content' }}>
            {fieldKey.includes('submit')
              ? 'Отправить на проверку'
              : fieldKey.includes('draft')
                ? 'Черновик'
                : 'Отмена'}
          </button>
        ) : (
          <input className="tooltip-live-preview__input" readOnly value="" />
        )}
      </div>
    );
  }

  if (fieldKey.includes('deadline')) {
    return (
      <div className="tooltip-live-preview__field">
        <p className="form-hint" style={{ margin: '0 0 0.5rem' }}>
          Страница: Главная / блок "Что важно студенту"
        </p>
        <label className="tooltip-live-preview__label">
          до 10 февраля <TooltipInfo fieldKey={fieldKey} />
        </label>
      </div>
    );
  }

  return (
    <div className="tooltip-live-preview__field">
      <label className="tooltip-live-preview__label">
        {fallback} <TooltipInfo fieldKey={fieldKey} />
      </label>
      <input className="tooltip-live-preview__input" readOnly value="" />
    </div>
  );
}

function getFieldLabel(fieldKey) {
  return TOOLTIP_FIELD_KEYS.find((k) => k.value === fieldKey)?.label || fieldKey;
}

export default function Tooltips() {
  const dispatch = useAppDispatch();
  const tooltips = useAppSelector((s) => s.data.tooltips);
  const [requestError, setRequestError] = useState('');
  const [form, setForm] = useState({
    fieldKey: TOOLTIP_FIELD_KEYS[0].value,
    label: '',
    text: '',
  });
  const [previewMode, setPreviewMode] = useState(false);

  const add = async (e) => {
    e.preventDefault();
    setRequestError('');
    const existing = tooltips.find((t) => t.fieldKey === form.fieldKey);
    const payload = {
      fieldKey: form.fieldKey,
      label: form.label,
      text: form.text,
    };
    if (existing) {
      const updated = await dataApi
        .createOrUpdateTooltip({ ...payload, id: existing.id })
        .catch((error) => {
          setRequestError(error.message || 'Не удалось сохранить подсказку');
          return null;
        });
      if (!updated?.id) return;
      dispatch(
        setTooltips(
          tooltips.map((t) => (t.id === updated.id ? updated : t))
        )
      );
    } else {
      const created = await dataApi.createOrUpdateTooltip(payload).catch((error) => {
        setRequestError(error.message || 'Не удалось создать подсказку');
        return null;
      });
      if (!created?.id) return;
      dispatch(setTooltips([...tooltips, created]));
    }
    setForm({ fieldKey: TOOLTIP_FIELD_KEYS[0].value, label: '', text: '' });
  };

  const remove = async (id) => {
    dispatch(setTooltips(tooltips.filter((t) => t.id !== id)));
    await dataApi.deleteTooltip(id).catch(() => null);
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
      {requestError && <div className="alert alert--error">{requestError}</div>}

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
          <label style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="checkbox"
              checked={previewMode}
              onChange={(e) => setPreviewMode(e.target.checked)}
            />
            Предпросмотр
          </label>
          {previewMode && (
            <div className="card tooltip-live-preview">
              <p style={{ marginTop: 0 }}>
                <strong>Где используется:</strong>{' '}
                {TOOLTIP_FIELD_KEYS.find((k) => k.value === form.fieldKey)?.label || form.fieldKey}
              </p>
              <div className="tooltip-live-preview__canvas">
                <PreviewField fieldKey={form.fieldKey} />
              </div>
              <p className="form-hint" style={{ marginTop: '0.5rem' }}>
                Живой предпросмотр рендерит подсказку на визуальном элементе интерфейса.
              </p>
            </div>
          )}
          <button type="submit" className="btn btn--primary">
            Сохранить подсказку
          </button>
        </form>
      </div>

      <div className="table-wrap" style={{ marginTop: '1rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Элемент</th>
              <th>Заголовок</th>
              <th>Текст</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tooltips.map((t) => (
              <tr key={t.id}>
                <td>
                  <div>{getFieldLabel(t.fieldKey)}</div>
                  <small className="form-hint">
                    <code>{t.fieldKey}</code>
                  </small>
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
