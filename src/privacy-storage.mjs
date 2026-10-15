export const LANGUAGE_KEY = 'netlore.language';
export const NOTICE_KEY = 'netlore.privacyNotice';
export const NOTICE_VERSION = '2026-10-16';

export function readLocal(key, fallback = null, storage) {
  try { return (storage ?? globalThis.localStorage)?.getItem(key) ?? fallback; }
  catch { return fallback; }
}

export function writeLocal(key, value, storage) {
  try {
    (storage ?? globalThis.localStorage).setItem(key, value);
    return true;
  } catch { return false; }
}

export function clearNetLorePreferences(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    target.removeItem(LANGUAGE_KEY);
    target.removeItem(NOTICE_KEY);
    return true;
  } catch { return false; }
}
