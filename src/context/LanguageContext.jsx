import React, { createContext, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { translations } from '../data/translations';
import { splitLang, localize } from '../lib/i18nPath';

const LanguageContext = createContext();
export const LANGUAGE_PREF_KEY = 'language';

/**
 * The language comes from the URL (/es/... is Spanish, everything else English), so a shared
 * link always opens in the language it was copied in. Switching language swaps the URL prefix
 * and keeps the rest (page, ?foto=…, #anchor). The last choice is remembered for visits to "/".
 */
export const LanguageProvider = ({ children }) => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const { lang: language, path } = splitLang(pathname);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_PREF_KEY, language);
    } catch {
      /* storage blocked (private mode): the choice just isn't remembered */
    }
    // Screen readers and translators read the page in the language it is shown in
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (next) => {
    if (next === language) return;
    navigate(localize(path, next) + search + hash);
  };

  const toggleLanguage = () => setLanguage(language === 'en' ? 'es' : 'en');

  /** Internal link in the current language: localePath('/works') → '/es/works' in Spanish */
  const localePath = (to) => localize(to, language);

  const t = (section, key) => {
    try {
      const activeDict = translations[language] || translations.en;
      if (!key && activeDict[section]) {
        return activeDict[section];
      }
      return activeDict[section]?.[key] ?? translations.en[section]?.[key] ?? '';
    } catch {
      return '';
    }
  };

  const dict = translations[language] || translations.en;

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        localePath,
        t,
        dict,
        isEn: language === 'en',
        isEs: language === 'es',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
