import { useState } from 'react';
import TooltipInfo from './TooltipInfo';
import { ACHIEVEMENT_STATUS } from '../constants/achievements';
import { readFileAsAttachment } from '../utils/files';

export default function AchievementEditModal({
  achievement,
  direction,
  onClose,
  onSave,
  onDelete,
}) {
  const isRevision = achievement?.status === ACHIEVEMENT_STATUS.REVISION;
  const [title, setTitle] = useState(achievement?.title || '');
  const [description, setDescription] = useState(achievement?.description || '');
  const [achievementLevel, setAchievementLevel] = useState(
    achievement?.achievementLevel || 'faculty'
  );
  const [attachments, setAttachments] = useState(achievement?.attachments || []);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const hasUnsavedChanges =
    title !== (achievement?.title || '') ||
    description !== (achievement?.description || '') ||
    achievementLevel !== (achievement?.achievementLevel || 'faculty') ||
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
      const att = await readFileAsAttachment(file);
      setAttachments([...attachments, att]);
    } catch (err) {
      setFileError(err.message);
    }
    e.target.value = '';
  };

  const submit = (asDraft) => {
    setError('');
    if (!title.trim()) {
      setError('Укажите название');
      return;
    }
    if (!asDraft && description.trim().length < 100) {
      setError('Описание — не менее 100 символов');
      return;
    }
    const now = new Date().toISOString();
    onSave({
      ...achievement,
      title: title.trim(),
      description: description.trim(),
      achievementLevel,
      attachments,
      score: 0,
      status: asDraft
        ? ACHIEVEMENT_STATUS.DRAFT
        : isRevision
          ? ACHIEVEMENT_STATUS.SUBMITTED
          : ACHIEVEMENT_STATUS.SUBMITTED,
      revision: isRevision && !asDraft ? null : achievement?.revision,
      updatedAt: now,
    });
    onClose();
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
                <li key={i}>
                  {item.message}
                </li>
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
            <option value="faculty">Внутривузовский</option>
            <option value="regional">Региональный</option>
            <option value="federal">Всероссийский</option>
            <option value="international">Международный</option>
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
            Файлы (PDF, JPG, PNG) <TooltipInfo fieldKey="application.attachments" />
          </label>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFile} />
          {fileError && <p className="form-hint" style={{ color: '#b91c1c' }}>{fileError}</p>}
          {attachments.length > 0 && (
            <ul className="file-list">
              {attachments.map((f) => (
                <li key={f.id}>
                  <a href={f.dataUrl} download={f.name} target="_blank" rel="noreferrer">
                    {f.name}
                  </a>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => setAttachments(attachments.filter((x) => x.id !== f.id))}
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
          Баллы назначаются комиссией после проверки достижения.
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => submit(false)}
            title="Отправить на проверку"
          >
            <TooltipInfo fieldKey="application.submit" />
            {isRevision ? 'Отправить после правок' : 'Отправить на проверку'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => submit(true)}
            title="Сохранить черновик"
          >
            <TooltipInfo fieldKey="application.draft" />
            Черновик
          </button>
          {achievement?.id && onDelete && (
            <button type="button" className="btn btn--danger" onClick={onDelete}>
              Удалить
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleClose}
            title="Закрыть форму"
          >
            <TooltipInfo fieldKey="application.cancel" />
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
