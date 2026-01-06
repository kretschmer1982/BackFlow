export function normalizeTestIdValue(value?: string) {
  const source = (value ?? '').trim();
  if (!source) {
    return 'item';
  }
  const normalized = source
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/gi, 'ss');
  const slug = normalized.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
  return slug.toLowerCase() || 'item';
}

