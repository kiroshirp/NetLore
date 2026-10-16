import {LANGUAGE_KEY,readLocal} from './privacy-storage.mjs';

export const DEFAULT_LANGUAGE='en';
export const SUPPORTED_LANGUAGES=['es','en','fr'];

export function preferredLanguage(storage) {
 const saved=readLocal(LANGUAGE_KEY,null,storage);
 return SUPPORTED_LANGUAGES.includes(saved)?saved:DEFAULT_LANGUAGE;
}
