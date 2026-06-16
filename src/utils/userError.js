const TECHNICAL_MESSAGE_RE =
  /is not a function|cannot read propert|undefined|null|TypeError|ReferenceError|SyntaxError|at\s+\w+\s+\(/i;

export function formatUserError(error, fallback = 'Не удалось выполнить операцию') {
  const raw = String(error?.message || error || '').trim();
  if (!raw || TECHNICAL_MESSAGE_RE.test(raw)) {
    return fallback;
  }
  return raw;
}
