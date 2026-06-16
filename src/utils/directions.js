/** Только активные направления (доступные для подачи и отображения). */
export function getActiveDirections(directions = []) {
  return directions.filter((d) => d.active !== false);
}

export function formatDirectionsCount(count) {
  const n = Number(count) || 0;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} направление`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} направления`;
  return `${n} направлений`;
}

export function formatDirectionsList(directions = []) {
  const active = getActiveDirections(directions);
  if (active.length === 0) return 'направления уточняются в регламенте';
  return active.map((d) => d.shortTitle || d.title).join(', ');
}
