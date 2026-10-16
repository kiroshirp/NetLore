export const CATEGORIES = ['roleplay', 'freeroam', 'racing', 'pvp', 'social', 'custom'];
export const CATEGORY_LABELS = { roleplay:'Roleplay', freeroam:'Freeroam', racing:'Racing', pvp:'PvP', social:'Social', custom:'Custom' };

export function emptyServerDetails() {
  return { about:'', features:[], access:'', language:'' };
}

export function validateServerDetails(input) {
  if (input === undefined) return emptyServerDetails();
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_server');
  const details = emptyServerDetails();
  for (const [key,limit] of Object.entries({about:3000,access:1500,language:80})) {
    if (input[key] !== undefined && typeof input[key] !== 'string') throw new Error('invalid_server');
    details[key] = (input[key] || '').trim();
    if (details[key].length > limit) throw new Error('invalid_server');
  }
  if (input.features !== undefined) {
    if (!Array.isArray(input.features) || input.features.length > 8 || input.features.some(value=>typeof value !== 'string' || value.trim().length > 100)) throw new Error('invalid_server');
    details.features = [...new Set(input.features.map(value=>value.trim()).filter(Boolean))];
  }
  return details;
}

export function validateServer(input) {
  if (!input || typeof input !== 'object') throw new Error('invalid_server');
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (!name || name.length > 80 || description.length > 300 || !CATEGORIES.includes(input.category)) throw new Error('invalid_server');
  let url;
  try { url = new URL(input.url); } catch { throw new Error('invalid_url'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 2048) throw new Error('invalid_url');
  if (typeof input.promoted !== 'boolean' || typeof input.published !== 'boolean') throw new Error('invalid_server');
  return { name, description, category:input.category, url:url.href, promoted:input.promoted, published:input.published, details:validateServerDetails(input.details) };
}

export function filterServers(servers, category = 'all', query = '') {
  const normalize = value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
  const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return orderServers(servers.filter(server=>{
    if (category !== 'all' && server.category !== category) return false;
    const text = normalize([server.name,server.description,CATEGORY_LABELS[server.category],server.details?.about,server.details?.language,...(server.details?.features || [])].filter(Boolean).join(' '));
    return words.every(word=>text.includes(word));
  }));
}

export function serverDestination(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase();
    return {host:parsed.host,discord:host === 'discord.gg' || host === 'discord.com' || host === 'www.discord.com' || host === 'discordapp.com'};
  } catch { return null; }
}

export function orderServers(servers) {
  return [...servers].sort((a,b) => Number(b.promoted) - Number(a.promoted) || a.name.localeCompare(b.name, 'es', { sensitivity:'base' }) || a.id.localeCompare(b.id));
}
