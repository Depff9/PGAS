import { useState } from 'react';
import TooltipInfo from './TooltipInfo';
import { ACHIEVEMENT_STATUS } from '../constants/achievements';
import { getEventLevels } from '../constants/eventLevels';
import { readFileAsAttachment, MAX_ATTACHMENTS } from '../utils/files';
import { AttachmentList } from './AttachmentPreviewModal';

export default function AchievementEditModal({
  achievement,
  direction,
  regulations,
  onClose,
  onSave,
  onDelete,
}) {
  const isRevision = achievement?.status === ACHIEVEMENT_STATUS.REVISION;
  const eventLevels = getEventLevels(regulations);
  const [title, setTitle] = useState(achievement?.title || '');
  const [description, setDescription] = useState(achievement?.description || '');
  const [achievementLevel, setAchievementLevel] = useState(
    achievement?.achievementLevel || eventLevels[0]?.id || 'faculty'
  );
  const [attachments, setAttachments] = useState(achievement?.attachments || []);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [saving, setSaving] = useState(false);
  const hasUnsavedChanges =
    title !== (achievement?.title || '') ||
    description !== (achievement?.description || '') ||
    achievementLevel !== (achievement?.achievementLevel || eventLevels[0]?.id || 'faculty') ||
    JSON.stringify(attachments) !== JSON.stringify(achievement?.attachments || []);

  const handleClose = () => {
    if (hasUnsavedChanges && !confirm('Есть несохраненные изменения. Закрыть без сохранения?')) {
      return;
    }
    onClose();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError('');
    try {
      const att = await readFileAsAttachment(file, attachments.length);
      setAttachments([...attachments, att]);
    } catch (err) {
      setFileError(err.message);
    }
    e.target.value = '';
  };

  const saveAchievement = async () => {
    setError('');
    if (!title.trim()) {
      setError('Укажите название');
      return;
    }
    if (description.trim().length < 100) {
      setError('Описание — не менее 100 символов');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await onSave({
        ...achievement,
        title: title.trim(),
        description: description.trim(),
        achievementLevel,
        attachments,
        score: null,
        status: ACHIEVEMENT_STATUS.DRAFT,
        revision: isRevision ? achievement?.revision : null,
        updatedAt: now,
      });
    } catch (err) {
      setError(err.message || 'Не удалось сохранить достижение');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal card modal--wide">
        <header className="modal__header">
          <div>
            <h2>{achievement?.id ? 'Достижение' : 'Новое достижение'}</h2>
            <p className="form-hint">{direction?.title}</p>
          </div>
          <button type="button" className="modal__close" onClick={handleClose}>
            ×
          </button>
        </header>

        {isRevision && achievement.revision && (
          <div className="alert alert--error">
            <strong>Замечания комиссии:</strong>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.2rem' }}>
              {(achievement.revision.items || []).map((item, i) => (
                <li key={i}>{item.message}</li>
              ))}
              {achievement.revision.generalComment && (
                <li>{achievement.revision.generalComment}</li>
              )}
            </ul>
          </div>
        )}

        {error && <div className="alert alert--error">{error}</div>}

        <div className="form-group">
          <label>
            Уровень <TooltipInfo fieldKey="application.level" />
          </label>
          <select value={achievementLevel} onChange={(e) => setAchievementLevel(e.target.value)}>
            {eventLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>
            Название <TooltipInfo fieldKey="application.title" />
          </label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label>
            Описание <TooltipInfo fieldKey="application.description" />
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
          <p className="form-hint">{description.length} / мин. 100</p>
        </div>
        <div className="form-group">
          <label>
            Файлы (PDF, JPG, PNG, до {MAX_ATTACHMENTS} шт.){' '}
            <TooltipInfo fieldKey="application.attachments" />
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFile}
            disabled={attachments.length >= MAX_ATTACHMENTS}
          />
          {fileError && <p className="form-hint" style={{ color: '#b91c1c' }}>{fileError}</p>}
          {attachments.length > 0 && (
            <>
              <AttachmentList attachments={attachments} />
              <ul className="file-list file-list--actions">
                {attachments.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setAttachments(attachments.filter((x) => x.id !== f.id))}
                    >
                      Удалить «{f.name}»
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
          Достижение сохраняется в черновик. Подать заявление целиком можно в разделе «Моё заявление».
          Баллы назначает комиссия после проверки.
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={saveAchievement}
            disabled={saving}
          >
            {achievement?.id ? 'Сохранить изменения' : 'Добавить достижение'}
          </button>
          {achievement?.id && onDelete && (
            <button type="button" className="btn btn--danger" onClick={onDelete}>
              Удалить
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={handleClose}>
            <TooltipInfo fieldKey="application.cancel" />
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
