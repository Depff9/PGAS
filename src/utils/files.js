const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MIME_ALIASES = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
};

function normalizeMimeType(value) {
  const raw = String(value || '').trim().toLowerCase();
  return MIME_ALIASES[raw] || raw;
}

function inferMimeTypeFromName(fileName) {
  const name = String(fileName || '').toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return '';
}

export function readFileAsAttachment(file, currentCount = 0) {
  return new Promise((resolve, reject) => {
    if (currentCount >= MAX_ATTACHMENTS) {
      reject(new Error(`Не более ${MAX_ATTACHMENTS} файлов на одно достижение`));
      return;
    }
    const mimeType = normalizeMimeType(file.type) || inferMimeTypeFromName(file.name);
    if (!ALLOWED_TYPES.includes(mimeType)) {
      reject(new Error('Допустимы только PDF, JPEG, PNG, WebP'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('Файл не больше 2 МБ'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: 'f' + Date.now(),
        name: file.name,
        mimeType,
        size: file.size,
        dataUrl: reader.result,
      });
    };
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

export { MAX_ATTACHMENTS, MAX_FILE_SIZE };
