import { useState } from 'react';

export default function AttachmentPreviewModal({ file, onClose }) {
  const [zoom, setZoom] = useState(1);
  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';

  const download = () => {
    const link = document.createElement('a');
    link.href = file.dataUrl;
    link.download = file.name || 'attachment';
    link.click();
  };

  const zoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));

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
            </>
          )}
          <button type="button" className="btn btn--primary btn--sm" onClick={download}>
            Скачать
          </button>
        </div>

        <div className="attachment-preview__body">
          {isImage && (
            <img
              src={file.dataUrl}
              alt={file.name}
              className="attachment-preview__image"
              style={{ transform: `scale(${zoom})` }}
            />
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

export function AttachmentList({ attachments }) {
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
        <AttachmentPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </>
  );
}
