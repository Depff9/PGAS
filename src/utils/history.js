export function createHistoryEntry({ category, action, summary, userId, userName, snapshot }) {
  return {
    id: 'h' + Date.now(),
    category,
    action,
    summary,
    userId,
    userName,
    snapshot,
    createdAt: new Date().toISOString(),
  };
}
