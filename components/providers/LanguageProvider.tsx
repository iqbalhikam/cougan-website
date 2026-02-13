'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { dictionaries, Locale } from '@/lib/dictionaries';

type Dictionary = typeof dictionaries.en;

interface LanguageContextType {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  dict: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Locale>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Locale;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'id')) {
      // Use setTimeout to avoid "setState synchronously within an effect" warning
      // by moving the update to the next tick.
      setTimeout(() => {
        setLanguage((prev) => (prev === savedLanguage ? prev : savedLanguage));
      }, 0);
    }
  }, []);

  const handleSetLanguage = React.useCallback((lang: Locale) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  }, []);

  const value = React.useMemo(
    () => ({
      language,
      setLanguage: handleSetLanguage,
      dict: dictionaries[language],
    }),
    [language, handleSetLanguage],
  );

  // Prevent hydration mismatch by rendering nothing until loaded,
  // or you could render with a default but that might cause a flash.
  // For simpler SEO-friendly static sites, just default 'en' is fine too,
  // but to persist user pref, we need client-side logic.
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
