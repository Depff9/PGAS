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

export function mapHistoryEntryFromApi(entry) {
  if (!entry) return null;
  const payload = entry.payload || {};
  return {
    id: entry.id,
    category: payload.category || entry.entity,
    action: payload.action || entry.action,
    summary: payload.summary || '',
    userId: payload.userId || entry.createdBy || null,
    userName: payload.userName || '',
    snapshot: payload.snapshot || null,
    targetId: payload.targetId || null,
    metadata: payload.metadata || null,
    createdAt: entry.createdAt,
  };
}
