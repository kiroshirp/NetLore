import { createContext, useContext, useEffect, useState } from 'react';
import messages from './locales/messages.json';

const LanguageContext = createContext(null);
const storageKey = 'netlore.language';

function savedLanguage() {
  try {
    const language = localStorage.getItem(storageKey);
    if (Object.hasOwn(messages, language)) return language;
  } catch { /* Storage can be disabled. */ }
  return 'es';
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(savedLanguage);
  const t = messages[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = t.pageTitle;
    document.querySelector('meta[name="description"]').content = t.metaDescription;
    try { localStorage.setItem(storageKey, language); } catch { /* Keep this visit functional. */ }
  }, [language, t]);

  function changeLanguage(value) {
    if (Object.hasOwn(messages, value)) setLanguage(value);
  }

  return <LanguageContext.Provider value={{ language, changeLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
