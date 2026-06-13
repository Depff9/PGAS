export function toggleSortState(prev, key, defaultDir = 'asc') {
  if (!prev || prev.key !== key) return { key, dir: defaultDir };
  return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
}

export function compareSortValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  const na = Number(a);
  const nb = Number(b);
  const bothNumeric = Number.isFinite(na) && Number.isFinite(nb) && `${a}`.trim() !== '' && `${b}`.trim() !== '';
  if (bothNumeric) return na - nb;

  return String(a).localeCompare(String(b), 'ru', { sensitivity: 'base' });
}

export function sortBySelectors(items, sortState, selectors) {
  if (!sortState?.key || !selectors?.[sortState.key]) return items;
  const getter = selectors[sortState.key];
  const factor = sortState.dir === 'desc' ? -1 : 1;
  return [...items].sort((left, right) => factor * compareSortValues(getter(left), getter(right)));
}
