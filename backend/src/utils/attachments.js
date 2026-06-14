import { createHttpError } from './http.js';

const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_DATA_PREFIX = /^data:(application\/pdf|image\/(?:jpeg|png|webp));base64,/i;

export function assertValidAttachments(raw) {
  if (raw == null) return undefined;
  if (!Array.isArray(raw)) {
    throw createHttpError(400, 'Вложения должны быть массивом');
  }
  if (raw.length > MAX_ATTACHMENTS) {
    throw createHttpError(400, `Не более ${MAX_ATTACHMENTS} файлов на достижение`);
  }

  return raw.map((item, index) => {
    const name = String(item?.name || '').trim().slice(0, 255);
    const mimeType = String(item?.mimeType || '').trim().toLowerCase();
    const dataUrl = String(item?.dataUrl || '');
    const size = Number(item?.size || 0);

    if (!name) throw createHttpError(400, `Имя файла #${index + 1} обязательно`);
    if (!ALLOWED_MIME.has(mimeType)) {
      throw createHttpError(400, `Недопустимый тип файла: ${name}`);
    }
    if (!ALLOWED_DATA_PREFIX.test(dataUrl)) {
      throw createHttpError(400, `Недопустимое содержимое файла: ${name}`);
    }
    if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_SIZE) {
      throw createHttpError(400, `Размер файла ${name} должен быть от 1 байта до 2 МБ`);
    }

    return {
      id: String(item?.id || `f${Date.now()}-${index}`),
      name,
      mimeType,
      size,
      dataUrl,
    };
  });
}
