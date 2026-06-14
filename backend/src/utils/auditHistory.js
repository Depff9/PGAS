import { prisma } from '../db.js';

export async function recordAuditEntry({
  action,
  entity,
  summary,
  createdBy,
  userName = null,
  targetId = null,
  metadata = null,
}) {
  const payload = {
    category: entity,
    action,
    summary,
    userId: createdBy,
    userName,
    targetId,
    metadata,
  };

  await prisma.historyEntry.create({
    data: {
      id: `h${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      entity,
      payload,
      createdBy,
    },
  });
}
