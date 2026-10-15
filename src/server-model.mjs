export const CATEGORIES = ['roleplay', 'freeroam', 'racing', 'pvp', 'social', 'custom'];
export const CATEGORY_LABELS = { roleplay:'Roleplay', freeroam:'Freeroam', racing:'Racing', pvp:'PvP', social:'Social', custom:'Custom' };

export function validateServer(input) {
  if (!input || typeof input !== 'object') throw new Error('invalid_server');
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (!name || name.length > 80 || description.length > 300 || !CATEGORIES.includes(input.category)) throw new Error('invalid_server');
  let url;
  try { url = new URL(input.url); } catch { throw new Error('invalid_url'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 2048) throw new Error('invalid_url');
  if (typeof input.promoted !== 'boolean' || typeof input.published !== 'boolean') throw new Error('invalid_server');
  return { name, description, category:input.category, url:url.href, promoted:input.promoted, published:input.published };
}

export function orderServers(servers) {
  return [...servers].sort((a,b) => Number(b.promoted) - Number(a.promoted) || a.name.localeCompare(b.name, 'es', { sensitivity:'base' }) || a.id.localeCompare(b.id));
}
