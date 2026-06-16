import { useState } from 'react';
import { formatFullName } from '../mock/users';
import { ACHIEVEMENT_STATUS, ACHIEVEMENT_FIELDS } from '../constants/achievements';
import { revisionTemplates } from '../mock/revisionTemplates';
import { AttachmentList } from './AttachmentPreviewModal';

export default function AchievementReviewModal({
  achievement,
  student,
  direction,
  readOnly = false,
  onClose,
  onSave,
}) {
  const [finalScore, setFinalScore] = useState(
    achievement.finalScore ?? 0
  );
  const [revisionItems, setRevisionItems] = useState(
    achievement.revision?.items?.length
      ? achievement.revision.items
      : [{ field: 'description', message: '' }]
  );
  const [generalComment, setGeneralComment] = useState(
    achievement.revision?.generalComment || ''
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const hasUnsavedChanges =
    Number(finalScore) !== Number(achievement.finalScore ?? 0) ||
    generalComment.trim() !== (achievement.revision?.generalComment || '').trim() ||
    JSON.stringify(revisionItems) !== JSON.stringify(achievement.revision?.items?.length ? achievement.revision.items : [{ field: 'description', message: '' }]);

  const handleClose = () => {
    if (
      !readOnly &&
      hasUnsavedChanges &&
      !confirm('Есть несохраненные изменения. Закрыть без сохранения?')
    ) {
      return;
    }
    onClose();
  };

  const applyTemplate = (tpl) => {
    setRevisionItems((prev) => [...prev, { field: tpl.field, message: tpl.text }]);
    setSelectedTemplateId('');
  };

  const saveWithStatus = (status, extra = {}) => {
    const revision =
      status === ACHIEVEMENT_STATUS.REVISION
        ? {
            items: revisionItems.filter((i) => i.message.trim()),
            generalComment: generalComment.trim(),
            templateIds: [],
            requestedAt: new Date().toISOString(),
          }
        : null;

    onSave({
      ...achievement,
      status,
      finalScore:
        status === ACHIEVEMENT_STATUS.APPROVED
          ? Number(finalScore)
          : achievement.finalScore ?? 0,
      score: 0,
      revision,
      updatedAt: new Date().toISOString(),
      ...extra,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal card modal--wide">
        <header className="modal__header">
          <h2>{readOnly ? 'Просмотр достижения' : 'Рассмотрение достижения'}</h2>
          <button type="button" className="modal__close" onClick={handleClose}>
            ×
          </button>
        </header>

        <dl className="profile-meta">
          <dt>Студент</dt>
          <dd>{formatFullName(student)}</dd>
          <dt>Направление</dt>
          <dd>{direction?.title}</dd>
          <dt>Ячейка</dt>
          <dd>№{(achievement.slotIndex ?? 0) + 1}</dd>
        </dl>

        <h3>{achievement.title}</h3>
        <p className="modal__text">{achievement.description}</p>

        {achievement.attachments?.length > 0 && (
          <div className="form-group">
            <label>Вложения</label>
            <AttachmentList
              attachments={achievement.attachments}
              achievementId={achievement.id}
              secureDownload
            />
          </div>
        )}

        <div className="form-row form-row--2">
          <div className="form-group">
            <label>Итоговые баллы (комиссия)</label>
            <input
              type="number"
              min={0}
              value={finalScore}
              onChange={(e) => setFinalScore(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>

        {!readOnly && (
        <div className="editor-block">
          <h4>Правки (шаблоны)</h4>
          <div className="form-group">
            <label>Выберите шаблон</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => {
                const nextId = e.target.value;
                setSelectedTemplateId(nextId);
                const tpl = revisionTemplates.find((item) => item.id === nextId);
                if (!tpl) return;
                applyTemplate(tpl);
              }}
            >
              <option value="">— выбрать шаблон —</option>
              {revisionTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          {revisionItems.map((item, idx) => (
            <div key={idx} className="form-row form-row--2" style={{ marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>Поле</label>
                <select
                  value={item.field}
                  onChange={(e) => {
                    const next = [...revisionItems];
                    next[idx] = { ...next[idx], field: e.target.value };
                    setRevisionItems(next);
                  }}
                >
                  {ACHIEVEMENT_FIELDS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Замечание</label>
                <input
                  value={item.message}
                  onChange={(e) => {
                    const next = [...revisionItems];
                    next[idx] = { ...next[idx], message: e.target.value };
                    setRevisionItems(next);
                  }}
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() =>
              setRevisionItems([...revisionItems, { field: 'description', message: '' }])
            }
          >
            + Замечание
          </button>
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label>Общий комментарий</label>
            <textarea
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        )}

        <div className="form-actions">
          {readOnly ? (
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Закрыть
            </button>
          ) : (
            <>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() =>
              saveWithStatus(ACHIEVEMENT_STATUS.APPROVED, { finalScore: Number(finalScore) })
            }
          >
            Одобрить
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => saveWithStatus(ACHIEVEMENT_STATUS.REVISION)}
          >
            Отправить на правки
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => saveWithStatus(ACHIEVEMENT_STATUS.REJECTED)}
          >
            Отклонить
          </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
