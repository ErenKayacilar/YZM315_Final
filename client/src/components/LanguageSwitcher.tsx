'use client';

import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    const toggleLanguage = () => {
        const newLang = currentLang === 'tr' ? 'en' : 'tr';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
            title={currentLang === 'tr' ? 'Switch to English' : 'Türkçe\'ye geç'}
        >
            <span className="text-lg">{currentLang === 'tr' ? '🇹🇷' : '🇬🇧'}</span>
            <span className="hidden sm:inline text-gray-700 dark:text-slate-200">
                {currentLang === 'tr' ? 'TR' : 'EN'}
            </span>
        </button>
    );
}
