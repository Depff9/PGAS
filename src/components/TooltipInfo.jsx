import { useState, useRef, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';

export default function TooltipInfo({ fieldKey, label }) {
  const tooltips = useAppSelector((s) => s.data.tooltips);
  const tip = tooltips.find((t) => t.fieldKey === fieldKey);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!tip) return null;

  return (
    <span className={'tooltip-info' + (open ? ' tooltip-info--open' : '')} ref={ref}>
      <button
        type="button"
        className="tooltip-info__btn"
        aria-label={label || tip.label || 'Подсказка'}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <span className="tooltip-info__popup" role="tooltip">
          <strong>{tip.label}</strong>
          <p>{tip.text}</p>
        </span>
      )}
    </span>
  );
}
