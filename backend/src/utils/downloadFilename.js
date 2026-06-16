export function sanitizeDownloadFilename(name) {
  const cleaned = String(name || 'attachment')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  return cleaned || 'attachment';
}
