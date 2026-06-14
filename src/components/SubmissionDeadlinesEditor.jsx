import { useMemo } from 'react';
import {
  PERIOD_HEADINGS,
  SUBMISSION_PERIODS,
  formatDeadlineLabel,
  fromDatetimeLocalValue,
  getMinDatetimeLocalValue,
  toDatetimeLocalValue,
} from '../utils/submissionDeadlines';

export default function SubmissionDeadlinesEditor({ value, onChange, error = '' }) {
  const minLocal = useMemo(() => getMinDatetimeLocalValue(), []);

  const setActivePeriod = (activePeriod) => {
    onChange({ ...value, activePeriod });
  };

  const setPeriodEndsAt = (period, localValue) => {
    const endsAt = fromDatetimeLocalValue(localValue);
    if (!endsAt) return;
    onChange({
      ...value,
      [period]: { endsAt },
    });
  };

  return (
    <div className="deadline-editor">
      <div className="form-group">
        <label htmlFor="deadline-active-period">Текущий период приёма</label>
        <select
          id="deadline-active-period"
          value={value.activePeriod}
          onChange={(e) => setActivePeriod(e.target.value)}
        >
          <option value={SUBMISSION_PERIODS.WINTER}>{PERIOD_HEADINGS.winter}</option>
          <option value={SUBMISSION_PERIODS.SUMMER}>{PERIOD_HEADINGS.summer}</option>
        </select>
        <p className="form-hint">
          От этого периода зависят блокировка подачи, надпись на главной и активный дедлайн в
          системе.
        </p>
      </div>

      <div className="form-row form-row--2">
        {[SUBMISSION_PERIODS.WINTER, SUBMISSION_PERIODS.SUMMER].map((period) => (
          <div key={period} className="form-group">
            <label htmlFor={`deadline-${period}`}>{PERIOD_HEADINGS[period]}</label>
            <input
              id={`deadline-${period}`}
              type="datetime-local"
              className="deadline-editor__datetime"
              min={minLocal}
              step={60}
              value={toDatetimeLocalValue(value[period]?.endsAt)}
              onChange={(e) => setPeriodEndsAt(period, e.target.value)}
            />
            <p className="form-hint">
              Окончание: {formatDeadlineLabel(value[period]?.endsAt)}
            </p>
          </div>
        ))}
      </div>

      <div className="deadline-editor__preview">
        <strong>Активный дедлайн:</strong>{' '}
        {formatDeadlineLabel(value[value.activePeriod]?.endsAt)}
      </div>

      {error && <div className="alert alert--error">{error}</div>}
    </div>
  );
}
