export function createHistoryEntry({
  category,
  action,
  summary,
  userId,
  userName,
  snapshot,
  targetId = null,
  metadata = null,
}) {
  return {
    id: 'h' + Date.now(),
    category,
    action,
    summary,
    userId,
    userName,
    snapshot,
    targetId,
    metadata,
    createdAt: new Date().toISOString(),
  };
}
