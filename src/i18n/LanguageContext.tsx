import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Language = 'sv' | 'en';

interface LanguageContextValue {
    language: Language;
    locale: string;
    toggleLanguage: () => void;
    tr: (sv: string, en: string) => string;
}

const STORAGE_KEY = 'kvitto_language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'sv' || stored === 'en') {
            return stored;
        }
        return 'sv';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, language);
    }, [language]);

    const value = useMemo<LanguageContextValue>(
        () => ({
            language,
            locale: language === 'sv' ? 'sv-SE' : 'en-US',
            toggleLanguage: () => setLanguage((prev) => (prev === 'sv' ? 'en' : 'sv')),
            tr: (sv, en) => (language === 'sv' ? sv : en),
        }),
        [language]
    );

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}