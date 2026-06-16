export const SUBMISSION_PERIODS = {
  WINTER: 'winter',
  SUMMER: 'summer',
};

export const PERIOD_LABELS = {
  winter: 'зимней сессии',
  summer: 'летней сессии',
};

export const PERIOD_HEADINGS = {
  winter: 'Зимняя сессия',
  summer: 'Летняя сессия',
};

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

const WALL_CLOCK_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function pad(value) {
  return String(value).padStart(2, '0');
}

function buildWallClock(year, monthIndex, day, hour, minute) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

function getAcademicYearStartYear(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  return month >= 8 ? year : year - 1;
}

export function normalizeEndsAt(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (WALL_CLOCK_RE.test(str)) return str;
  const local = toDatetimeLocalValue(str);
  return local || null;
}

export function wallClockToTimestamp(value, referenceDate = new Date()) {
  if (!value) return NaN;
  const str = String(value).trim();
  if (WALL_CLOCK_RE.test(str)) {
    const [datePart, timePart] = str.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, 59, 999).getTime();
  }
  const ts = new Date(str).getTime();
  return Number.isFinite(ts) ? ts : NaN;
}

export function getDefaultSubmissionDeadlines(referenceDate = new Date()) {
  const startYear = getAcademicYearStartYear(referenceDate);
  const month = referenceDate.getMonth();
  return {
    activePeriod: month >= 5 && month <= 7 ? SUBMISSION_PERIODS.SUMMER : SUBMISSION_PERIODS.WINTER,
    winter: {
      endsAt: buildWallClock(startYear + 1, 1, 10, 23, 59),
    },
    summer: {
      endsAt: buildWallClock(startYear + 1, 6, 1, 23, 59),
    },
  };
}

function parseLegacyDeadlineToken(token) {
  const match = String(token || '')
    .trim()
    .match(/(\d{1,2})\s+([а-яё]+)(?:\s+(\d{4}))?/i);
  if (!match) return null;
  const day = Number(match[1]);
  const month = MONTH_MAP[match[2].toLowerCase()];
  const year = Number(match[3] || new Date().getFullYear());
  if (!Number.isFinite(day) || !Number.isFinite(year) || month == null) return null;
  return buildWallClock(year, month, day, 23, 59);
}

function parseLegacyDeadlinesFromSection(regulations) {
  const section = regulations?.sections?.find((s) => s.id === 'r2');
  const text = section?.content || '';
  const winterToken = text.match(/зимней[^—-]*[—-]\s*до\s*([^,.;]+)/i)?.[1];
  const summerToken = text.match(/летней[^—-]*[—-]\s*до\s*([^,.;]+)/i)?.[1];
  const winterEndsAt = parseLegacyDeadlineToken(winterToken);
  const summerEndsAt = parseLegacyDeadlineToken(summerToken);
  if (!winterEndsAt && !summerEndsAt) return null;

  const defaults = getDefaultSubmissionDeadlines();
  return {
    activePeriod: defaults.activePeriod,
    winter: { endsAt: winterEndsAt || defaults.winter.endsAt },
    summer: { endsAt: summerEndsAt || defaults.summer.endsAt },
  };
}

export function normalizeSubmissionDeadlines(regulations) {
  const source = regulations?.submissionDeadlines;
  if (source?.winter?.endsAt && source?.summer?.endsAt) {
    return {
      activePeriod:
        source.activePeriod === SUBMISSION_PERIODS.WINTER
          ? SUBMISSION_PERIODS.WINTER
          : SUBMISSION_PERIODS.SUMMER,
      winter: { endsAt: normalizeEndsAt(source.winter.endsAt) },
      summer: { endsAt: normalizeEndsAt(source.summer.endsAt) },
    };
  }

  return parseLegacyDeadlinesFromSection(regulations) || getDefaultSubmissionDeadlines();
}

export function formatDeadlineLabel(iso, { withTime = true, dayMonthOnly = false } = {}) {
  if (!iso) return '—';
  const ts = wallClockToTimestamp(iso);
  if (!Number.isFinite(ts)) return '—';
  const date = new Date(ts);

  if (dayMonthOnly) {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
  }

  if (withTime) {
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getActiveDeadlineIso(regulations, period = null) {
  const deadlines = normalizeSubmissionDeadlines(regulations);
  if (period === SUBMISSION_PERIODS.WINTER || period === SUBMISSION_PERIODS.SUMMER) {
    return deadlines[period]?.endsAt || null;
  }
  const active = deadlines[deadlines.activePeriod];
  return active?.endsAt || null;
}

export function getActiveDeadlineLabel(regulations, options) {
  return formatDeadlineLabel(getActiveDeadlineIso(regulations), options);
}

export function getActiveDeadlineHomeLabel(regulations) {
  return getActiveDeadlineLabel(regulations, { dayMonthOnly: true });
}

export function isDeadlineReached(iso, now = Date.now()) {
  const ts = wallClockToTimestamp(iso);
  if (!Number.isFinite(ts)) return false;
  return now > ts;
}

export function toDatetimeLocalValue(value) {
  if (!value) return '';
  const str = String(value).trim();
  if (WALL_CLOCK_RE.test(str)) return str;
  const date = new Date(str);
  if (!Number.isFinite(date.getTime())) return '';
  return buildWallClock(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  );
}

export function fromDatetimeLocalValue(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (!WALL_CLOCK_RE.test(str)) return null;
  return str;
}

export function getMinDatetimeLocalValue(referenceDate = new Date()) {
  return toDatetimeLocalValue(buildWallClock(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    referenceDate.getHours(),
    referenceDate.getMinutes()
  ));
}

export function buildDeadlineSectionContent(deadlines) {
  const normalized = normalizeSubmissionDeadlines({ submissionDeadlines: deadlines });
  const winterLabel = formatDeadlineLabel(normalized.winter.endsAt);
  const summerLabel = formatDeadlineLabel(normalized.summer.endsAt);
  const activeLabel = PERIOD_LABELS[normalized.activePeriod];
  const activeDeadline = formatDeadlineLabel(normalized[normalized.activePeriod].endsAt);

  return `Приём документов: по итогам зимней сессии — до ${winterLabel}, по итогам летней сессии — до ${summerLabel}. Сейчас открыт приём по итогам ${activeLabel} — до ${activeDeadline}. Назначение производится не реже двух раз в год по итогам промежуточной аттестации.`;
}

export function applyDeadlinesToSections(sections, deadlines) {
  const content = buildDeadlineSectionContent(deadlines);
  return (sections || []).map((section) =>
    section.id === 'r2' ? { ...section, content } : section
  );
}

export function validateSubmissionDeadlines(deadlines, { now = Date.now() } = {}) {
  const normalized = normalizeSubmissionDeadlines({ submissionDeadlines: deadlines });

  for (const period of [SUBMISSION_PERIODS.WINTER, SUBMISSION_PERIODS.SUMMER]) {
    const value = normalized[period]?.endsAt;
    if (!value || !Number.isFinite(wallClockToTimestamp(value))) {
      return {
        valid: false,
        message: `Укажите дату и время окончания для периода «${PERIOD_HEADINGS[period]}».`,
      };
    }
  }

  const activeValue = normalized[normalized.activePeriod]?.endsAt;
  if (isDeadlineReached(activeValue, now)) {
    return {
      valid: false,
      message: `Срок текущего периода приёма («${PERIOD_HEADINGS[normalized.activePeriod]}») не может быть в прошлом.`,
    };
  }

  return { valid: true, deadlines: normalized };
}

export function prepareRegulationPayload(regulations, submissionDeadlines) {
  const validation = validateSubmissionDeadlines(submissionDeadlines);
  if (!validation.valid) {
    return validation;
  }

  const nextDeadlines = validation.deadlines;
  const nextSections = applyDeadlinesToSections(regulations?.sections || [], nextDeadlines);

  return {
    valid: true,
    payload: {
      ...regulations,
      submissionDeadlines: nextDeadlines,
      sections: nextSections,
    },
  };
}
