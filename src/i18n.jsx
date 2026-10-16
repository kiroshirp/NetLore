import { createContext, useContext, useEffect, useState } from 'react';
import messages from './locales/messages.json';
import legalMessages from './locales/legal.json';
import { LANGUAGE_KEY, writeLocal } from './privacy-storage.mjs';
import { preferredLanguage } from './language-preference.mjs';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(preferredLanguage);
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
