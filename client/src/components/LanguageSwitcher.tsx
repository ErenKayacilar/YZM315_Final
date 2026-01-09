'use client';

import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'tr', flag: '🇹🇷', label: 'TR' },
    { code: 'en', flag: '🇬🇧', label: 'EN' },
    { code: 'de', flag: '🇩🇪', label: 'DE' },
];

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;

    const currentIndex = LANGUAGES.findIndex(l => l.code === currentLang);
    const current = LANGUAGES[currentIndex] || LANGUAGES[0];

    const cycleLanguage = () => {
        const nextIndex = (currentIndex + 1) % LANGUAGES.length;
        i18n.changeLanguage(LANGUAGES[nextIndex].code);
    };

    return (
        <button
            onClick={cycleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
            title="Dil Değiştir / Change Language / Sprache ändern"
        >
            <span className="text-lg">{current.flag}</span>
            <span className="hidden sm:inline text-gray-700 dark:text-slate-200">
                {current.label}
            </span>
        </button>
    );
}
