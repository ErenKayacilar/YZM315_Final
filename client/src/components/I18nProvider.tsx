'use client';

import { useEffect, useState } from 'react';
import '../i18n';

interface I18nProviderProps {
    children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return null;
    }

    return <>{children}</>;
}
