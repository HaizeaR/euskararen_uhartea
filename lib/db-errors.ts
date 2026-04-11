export function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;

  const maybeErr = err as { code?: string; message?: string };
  if (maybeErr.code === '42P01') return true;

  const msg = (maybeErr.message || '').toLowerCase();
  return msg.includes('relation') && msg.includes('does not exist');
}
