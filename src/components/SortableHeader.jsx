export default function SortableHeader({ label, sortKey, sortState, onToggle }) {
  const isActive = sortState?.key === sortKey;
  const arrow = isActive ? (sortState.dir === 'asc' ? '▲' : '▼') : '↕';

  return (
    <button type="button" className="table-sort" onClick={() => onToggle(sortKey)}>
      {label}
      <span className="table-sort__arrow" aria-hidden>
        {arrow}
      </span>
    </button>
  );
}
