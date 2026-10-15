import { createContext, useContext, useEffect, useState } from 'react';
import messages from './locales/messages.json';
import legalMessages from './locales/legal.json';
import { LANGUAGE_KEY, readLocal, writeLocal } from './privacy-storage.mjs';

const LanguageContext = createContext(null);

function savedLanguage() {
  const language = readLocal(LANGUAGE_KEY);
  if (Object.hasOwn(messages, language)) return language;
  return 'es';
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(savedLanguage);
  const t = messages[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.querySelector('meta[name="description"]').content = t.metaDescription;
  }, [language, t]);

  function changeLanguage(value) {
    if (Object.hasOwn(messages, value)) {
      setLanguage(value);
      writeLocal(LANGUAGE_KEY, value);
    }
  }

  return <LanguageContext.Provider value={{ language, changeLanguage, t, legal: legalMessages[language] }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
