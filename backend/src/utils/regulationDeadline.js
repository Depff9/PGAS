const MONTH_MAP = {
  января: 0,
  февраля: 1,
  марта: 2,
  апреля: 3,
  мая: 4,
  июня: 5,
  июля: 6,
  августа: 7,
  сентября: 8,
  октября: 9,
  ноября: 10,
  декабря: 11,
};

export function parseDeadlineIsoFromRegulation(regulation) {
  const section = regulation?.sections?.find((s) => s.id === 'r2');
  const text = section?.content || '';
  const dateMatch = text.match(/до\s+(\d{1,2})\s+([а-яё]+)\s+(\d{4})/i);
  if (!dateMatch) return null;

  const day = Number(dateMatch[1]);
  const month = MONTH_MAP[dateMatch[2].toLowerCase()];
  const year = Number(dateMatch[3]);
  if (!Number.isFinite(day) || !Number.isFinite(year) || month == null) return null;

  return new Date(year, month, day, 23, 59, 59).toISOString();
}
