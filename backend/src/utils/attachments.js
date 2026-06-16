import { createHttpError } from './http.js';

const MAX_ATTACHMENTS = 10;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_DATA_PREFIX = /^data:(application\/pdf|image\/(?:jpeg|png|webp));base64,/i;

function hasSignature(buffer, signature, offset = 0) {
  if (!buffer || buffer.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i += 1) {
    if (buffer[offset + i] !== signature[i]) return false;
  }
  return true;
}

function detectMimeByMagicBytes(buffer) {
  if (!buffer || buffer.length < 4) return null;

  if (hasSignature(buffer, [0x25, 0x50, 0x44, 0x46])) return 'application/pdf'; // %PDF

  if (hasSignature(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';

  if (hasSignature(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }

  if (
    hasSignature(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    hasSignature(buffer, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return 'image/webp';
  }

  return null;
}

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
    const match = dataUrl.match(/^data:[^;]+;base64,(.+)$/i);
    if (!match) {
      throw createHttpError(400, `Некорректный формат вложения: ${name}`);
    }
    let decoded;
    try {
      decoded = Buffer.from(match[1], 'base64');
    } catch {
      throw createHttpError(400, `Некорректное base64-содержимое файла: ${name}`);
    }
    if (decoded.length !== size) {
      throw createHttpError(400, `Поврежденные данные файла: ${name}`);
    }
    const detectedMime = detectMimeByMagicBytes(decoded);
    if (!detectedMime || detectedMime !== mimeType) {
      throw createHttpError(400, `Фактический тип файла не соответствует заявленному: ${name}`);
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
