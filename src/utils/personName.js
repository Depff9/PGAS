const NAME_ALLOWED_CHARS = /[^А-Яа-яЁё\-\s]/g;
const NAME_PATTERN = /^[А-ЯЁа-яё]+(?:[-\s][А-ЯЁа-яё]+)*$/;

export function sanitizePersonNameInput(value) {
  return String(value || '')
    .replace(NAME_ALLOWED_CHARS, '')
    .replace(/\s{2,}/g, ' ');
}

export function isValidPersonName(value) {
  const normalized = String(value || '').trim();
  return NAME_PATTERN.test(normalized);
}
