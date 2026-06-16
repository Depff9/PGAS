import { useState } from 'react';
import { downloadAchievementAttachment } from '../api/dataApi';

export default function AttachmentPreviewModal({
  file,
  onClose,
  achievementId = null,
  secureDownload = false,
}) {
  const [zoom, setZoom] = useState(100);
  const [downloading, setDownloading] = useState(false);
  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';

  const download = async () => {
    if (secureDownload && achievementId && file.id) {
      setDownloading(true);
      try {
        await downloadAchievementAttachment(achievementId, file.id);
      } catch (error) {
        alert(error.message || 'Не удалось скачать файл');
      } finally {
        setDownloading(false);
      }
      return;
    }

    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name || 'attachment';
    link.click();
  };

  const zoomIn = () => setZoom((value) => Math.min(300, value + 25));
  const zoomOut = () => setZoom((value) => Math.max(50, value - 25));
  const imageStyle =
    zoom === 100
      ? { maxWidth: '100%', width: 'auto', height: 'auto' }
      : { width: `${zoom}%`, maxWidth: 'none', height: 'auto' };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="modal card modal--wide attachment-preview"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2>{file.name}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <div className="attachment-preview__toolbar">
          {isImage && (
            <>
              <button type="button" className="btn btn--ghost btn--sm" onClick={zoomOut}>
                Уменьшить
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={zoomIn}>
                Увеличить
              </button>
              <span className="form-hint">{zoom}%</span>
            </>
          )}
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={download}
            disabled={downloading}
          >
            {downloading ? 'Скачивание…' : 'Скачать'}
          </button>
        </div>

        <div className="attachment-preview__body">
          {isImage && (
            <div className="attachment-preview__viewport">
              <img
                src={file.dataUrl}
                alt={file.name}
                className="attachment-preview__image"
                style={imageStyle}
              />
            </div>
          )}
          {isPdf && (
            <iframe
              src={file.dataUrl}
              title={file.name}
              className="attachment-preview__iframe"
            />
          )}
          {!isImage && !isPdf && (
            <p className="form-hint">Предпросмотр для этого типа файла недоступен. Скачайте файл.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AttachmentList({ attachments, achievementId = null, secureDownload = false }) {
  const [previewFile, setPreviewFile] = useState(null);

  if (!attachments?.length) return null;

  return (
    <>
      <ul className="file-list">
        {attachments.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              className="btn btn--ghost btn--sm file-list__link"
              onClick={() => setPreviewFile(f)}
            >
              {f.name}
            </button>
          </li>
        ))}
      </ul>
      {previewFile && (
        <AttachmentPreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          achievementId={achievementId}
          secureDownload={secureDownload}
        />
      )}
    </>
  );
}
