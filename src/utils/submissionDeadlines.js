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

function getAcademicYearStartYear(referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  return month >= 8 ? year : year - 1;
}

export function getDefaultSubmissionDeadlines(referenceDate = new Date()) {
  const startYear = getAcademicYearStartYear(referenceDate);
  const month = referenceDate.getMonth();
  return {
    activePeriod: month >= 5 && month <= 7 ? SUBMISSION_PERIODS.SUMMER : SUBMISSION_PERIODS.WINTER,
    winter: {
      endsAt: new Date(startYear + 1, 1, 10, 23, 59, 59).toISOString(),
    },
    summer: {
      endsAt: new Date(startYear + 1, 6, 1, 23, 59, 59).toISOString(),
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
  return new Date(year, month, day, 23, 59, 59).toISOString();
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
      winter: { endsAt: String(source.winter.endsAt) },
      summer: { endsAt: String(source.summer.endsAt) },
    };
  }

  return parseLegacyDeadlinesFromSection(regulations) || getDefaultSubmissionDeadlines();
}

export function formatDeadlineLabel(iso, { withTime = true } = {}) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '—';

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

export function getActiveDeadlineIso(regulations) {
  const deadlines = normalizeSubmissionDeadlines(regulations);
  const active = deadlines[deadlines.activePeriod];
  return active?.endsAt || null;
}

export function getActiveDeadlineLabel(regulations) {
  return formatDeadlineLabel(getActiveDeadlineIso(regulations));
}

export function isDeadlineReached(iso, now = Date.now()) {
  if (!iso) return false;
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return false;
  return now > ts;
}

export function toDatetimeLocalValue(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

export function getMinDatetimeLocalValue(referenceDate = new Date()) {
  return toDatetimeLocalValue(referenceDate.toISOString());
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
    const iso = normalized[period]?.endsAt;
    if (!iso || !Number.isFinite(new Date(iso).getTime())) {
      return {
        valid: false,
        message: `Укажите дату и время окончания для периода «${PERIOD_HEADINGS[period]}».`,
      };
    }
  }

  const activeIso = normalized[normalized.activePeriod]?.endsAt;
  if (isDeadlineReached(activeIso, now)) {
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
