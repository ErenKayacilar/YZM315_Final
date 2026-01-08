'use client';
import * as React from 'react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Critical: Avoid hydration mismatch by waiting for mount
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null; // Don't render anything until loaded on client
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 transition-all border border-gray-300 dark:border-slate-600"
            aria-label="Toggle Dark Mode"
        >
            {theme === 'dark' ? (
                <span className="text-xl">🌞</span> // Sun Icon
            ) : (
                <span className="text-xl">🌙</span> // Moon Icon
            )}
        </button>
    );
}
