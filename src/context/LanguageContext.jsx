import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../data/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Default to 'en' (English) as requested, unless user previously set a preference
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'es' : 'en'));
  };

  const t = (section, key) => {
    try {
      const activeDict = translations[language] || translations.en;
      if (!key && activeDict[section]) {
        return activeDict[section];
      }
      return activeDict[section]?.[key] ?? translations.en[section]?.[key] ?? '';
    } catch (e) {
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
