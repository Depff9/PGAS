import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { commissionSidebar } from '../config/navigation';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setRegulations, setHistory } from '../store/dataSlice';
import { setNotifications } from '../store/dataSlice';
import { setScoringMatrix } from '../store/dataSlice';
import { ROLES, formatFullName } from '../mock/users';
import { createHistoryEntry } from '../utils/history';
import Navbar from '../components/Navbar';
import { buildRegulationsUpdatedNotification } from '../utils/notifications';
import { dataApi } from '../api/dataApi';
import SubmissionDeadlinesEditor from '../components/SubmissionDeadlinesEditor';
import {
  buildDeadlineSectionContent,
  formatDeadlineLabel,
  normalizeSubmissionDeadlines,
  prepareRegulationPayload,
} from '../utils/submissionDeadlines';

export default function Regulations({ readOnly = false }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const directions = useAppSelector((s) => s.data.directions);
  const regulations = useAppSelector((s) => s.data.regulations);
  const history = useAppSelector((s) => s.data.history);
  const scoringMatrix = useAppSelector((s) => s.data.scoringMatrix);
  const users = useAppSelector((s) => s.data.users);
  const notifications = useAppSelector((s) => s.data.notifications);
  const canEdit = !readOnly && user?.role === ROLES.COMMISSION;
  const shouldRedirect =
    !readOnly && user?.role === ROLES.COMMISSION && !user.permissions?.canEditRegulations;

  const [title, setTitle] = useState(regulations?.title || 'Регламент ПГАС');
  const [sections, setSections] = useState(regulations?.sections || []);
  const [directionLimits, setDirectionLimits] = useState(
    regulations?.directionLimits || {}
  );
  const [defaultMax, setDefaultMax] = useState(regulations?.defaultMaxPerDirection ?? 7);
  const [submissionDeadlines, setSubmissionDeadlines] = useState(() =>
    normalizeSubmissionDeadlines(regulations)
  );
  const [deadlineError, setDeadlineError] = useState('');
  const [saved, setSaved] = useState(false);
  const [localLevels, setLocalLevels] = useState(scoringMatrix?.levels || []);

  useEffect(() => {
    if (!regulations) return;
    setTitle(regulations.title || 'Регламент ПГАС');
    setSections(regulations.sections || []);
    setDirectionLimits(regulations.directionLimits || {});
    setDefaultMax(regulations.defaultMaxPerDirection ?? 7);
    setSubmissionDeadlines(normalizeSubmissionDeadlines(regulations));
  }, [regulations?.updatedAt]);

  if (shouldRedirect) {
    return <Navigate to="/commission" replace />;
  }

  const updateSection = (id, field, value) => {
    if (id === 'r2' && field === 'content') return;
    setSections(sections.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const addSection = () => {
    setSections([
      ...sections,
      { id: 'r' + Date.now(), heading: 'Новый раздел', content: '' },
    ]);
  };

  const removeSection = (id) => {
    if (sections.length <= 1 || id === 'r2') return;
    setSections(sections.filter((s) => s.id !== id));
  };

  const save = async () => {
    setDeadlineError('');
    try {
      const prepared = prepareRegulationPayload(
        {
          ...regulations,
          title,
          sections,
          defaultMaxPerDirection: Number(defaultMax) || 7,
          directionLimits: { ...directionLimits },
        },
        submissionDeadlines
      );

      if (!prepared.valid) {
        setDeadlineError(prepared.message);
        return;
      }

      const payload = {
        ...prepared.payload,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.id,
      };

      const historyEntry = createHistoryEntry({
        category: 'regulations',
        action: 'update',
        summary: 'Обновлён регламент подачи заявлений',
        userId: user.id,
        userName: formatFullName(user),
      });

      dispatch(setRegulations(payload));
      const savedRegulations = await dataApi.updateRegulations(payload);
      if (savedRegulations) {
        dispatch(setRegulations(savedRegulations));
        setSubmissionDeadlines(normalizeSubmissionDeadlines(savedRegulations));
        setSections(savedRegulations.sections || []);
      }

      const nextMatrix = {
        ...scoringMatrix,
        levels: localLevels,
        updatedAt: new Date().toISOString(),
      };
      dispatch(setScoringMatrix(nextMatrix));
      const savedMatrix = await dataApi.updateScoringMatrix(nextMatrix);
      if (savedMatrix) dispatch(setScoringMatrix(savedMatrix));

      const infoNotifications = users
        .filter((u) => u.role === ROLES.STUDENT)
        .map((u) =>
          buildRegulationsUpdatedNotification(
            u.id,
            'Сроки или правила подачи заявлений обновлены комиссией.'
          )
        );
      dispatch(setNotifications([...infoNotifications, ...notifications]));
      await dataApi.createNotificationsBulk(infoNotifications).catch(() => null);
      dispatch(
        setHistory([
          { ...historyEntry, snapshot: payload },
          ...history,
        ])
      );
      await dataApi.saveHistoryEntry({ ...historyEntry, snapshot: payload }).catch(() => null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert(error.message || 'Не удалось сохранить регламент');
    }
  };

  if (!regulations) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="container page-content">
          <div className="alert alert--error">Регламент пока не загружен</div>
        </div>
      </div>
    );
  }

  const normalizedDeadlines = normalizeSubmissionDeadlines({
    submissionDeadlines,
    sections,
  });

  const content = (
    <>
      <header className="page-header">
        <h1>Регламент</h1>
        <p>
          {canEdit
            ? 'Редактирование правил подачи и оформления заявлений'
            : 'Правила подачи и оформления заявлений на ПГАС'}
        </p>
      </header>

      {saved && <div className="alert alert--success">Регламент сохранён</div>}

      <div className="card">
        {canEdit ? (
          <div className="form-group editor-block">
            <label>Заголовок документа</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
        ) : (
          <h2 style={{ marginTop: 0 }}>{regulations.title}</h2>
        )}

        {canEdit && (
          <div className="editor-block">
            <h3 style={{ marginTop: 0 }}>Уровни мероприятий</h3>
            <div className="form-row form-row--2" style={{ marginBottom: '0.5rem' }}>
              {localLevels.map((l) => (
                <div key={l.id} className="form-group">
                  <input
                    value={l.label}
                    onChange={(e) =>
                      setLocalLevels(
                        localLevels.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x))
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {canEdit ? (
          <div className="editor-block">
            <h3 style={{ marginTop: 0 }}>Сроки подачи заявлений</h3>
            <p className="form-hint">
              Даты сохраняются в базе данных и автоматически попадают в раздел «Сроки подачи»,
              на главную страницу и в ограничения системы.
            </p>
            <SubmissionDeadlinesEditor
              value={submissionDeadlines}
              onChange={setSubmissionDeadlines}
              error={deadlineError}
            />
          </div>
        ) : (
          <div className="card editor-block">
            <h3>Сроки подачи заявлений</h3>
            <ul>
              <li>Зимняя сессия: {formatDeadlineLabel(normalizedDeadlines.winter.endsAt)}</li>
              <li>Летняя сессия: {formatDeadlineLabel(normalizedDeadlines.summer.endsAt)}</li>
              <li>
                Текущий период:{' '}
                {formatDeadlineLabel(normalizedDeadlines[normalizedDeadlines.activePeriod].endsAt)}
              </li>
            </ul>
          </div>
        )}

        {canEdit && (
          <div className="editor-block">
            <h3 style={{ marginTop: 0 }}>Лимит достижений по направлениям</h3>
            <p className="form-hint">
              Сколько достижений студент может указать в одном заявлении по каждому направлению
              ПГАС.
            </p>
            <div className="form-group">
              <label>Значение по умолчанию</label>
              <input
                type="number"
                min={1}
                max={20}
                value={defaultMax}
                onChange={(e) => setDefaultMax(e.target.value)}
              />
            </div>
            {directions.map((d) => (
              <div key={d.id} className="form-row form-row--2" style={{ marginBottom: '0.5rem' }}>
                <div className="form-group">
                  <label>{d.title}</label>
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={directionLimits[d.id] ?? defaultMax}
                    onChange={(e) =>
                      setDirectionLimits({
                        ...directionLimits,
                        [d.id]: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {!canEdit && (
          <div className="card editor-block">
            <h3>Уровни мероприятий</h3>
            <ul>
              {(scoringMatrix?.levels || []).map((l) => (
                <li key={l.id}>{l.label}</li>
              ))}
            </ul>
          </div>
        )}

        {!canEdit && (
          <div className="card editor-block">
            <h3>Лимиты по направлениям</h3>
            <ul>
              {directions.map((d) => (
                <li key={d.id}>
                  {d.title}: {regulations.directionLimits?.[d.id] ?? regulations.defaultMaxPerDirection ?? 7}
                </li>
              ))}
            </ul>
          </div>
        )}

        {sections.map((section, index) => (
          <div key={section.id} className="editor-block">
            {canEdit ? (
              <>
                <div className="editor-block__head">
                  <span className="editor-block__num">Раздел {index + 1}</span>
                </div>
                <div className="form-group">
                  <label>Заголовок раздела</label>
                  <input
                    value={section.heading}
                    onChange={(e) => updateSection(section.id, 'heading', e.target.value)}
                  />
                </div>
                {section.id === 'r2' ? (
                  <div className="form-group">
                    <label>Содержание</label>
                    <p className="form-hint">
                      Текст раздела формируется автоматически из блока «Сроки подачи заявлений».
                    </p>
                    <div className="regulation-section regulation-section--readonly">
                      <p>{buildDeadlineSectionContent(submissionDeadlines)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Содержание</label>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
                {section.id !== 'r2' && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => removeSection(section.id)}
                  >
                    Удалить раздел
                  </button>
                )}
              </>
            ) : (
              <div className="regulation-section regulation-section--readonly">
                <h3>{section.heading}</h3>
                <p>
                  {section.id === 'r2'
                    ? buildDeadlineSectionContent(normalizedDeadlines)
                    : section.content}
                </p>
              </div>
            )}
          </div>
        ))}

        {canEdit && (
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={addSection}>
              + Добавить раздел
            </button>
            <button type="button" className="btn btn--primary" onClick={save}>
              Сохранить регламент
            </button>
          </div>
        )}
      </div>
    </>
  );

  if (readOnly) {
    return (
      <div className="app-shell">
        <Navbar />
        <div className="container page-content">{content}</div>
      </div>
    );
  }

  return (
    <DashboardLayout sidebarItems={commissionSidebar} sidebarTitle="Кабинет комиссии">
      {content}
    </DashboardLayout>
  );
}
