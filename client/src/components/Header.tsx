'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from 'next-themes';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import Sidebar from './Sidebar';

export default function Header() {
    const { user, logout, isLoading } = useAuth();
    const { setTheme } = useTheme();
    const pathname = usePathname();
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Login/Register sayfalarında header'ı gösterme
    if (pathname === '/login' || pathname === '/register') return null;

    return (
        <>
            <header className="glass-effect border-b border-border/50 p-4 flex justify-between items-center mb-6 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    {/* Hamburger Menu Button - Mobile Only */}
                    {user && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 rounded-lg hover:bg-primary/10 transition-all duration-200 hover:shadow-md hover:shadow-blue-500/10"
                            aria-label="Open menu"
                        >
                            <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    )}

                    <Link href="/" className="font-bold text-xl bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent hover:from-blue-600 hover:to-indigo-700 transition-all">
                        {t('header.title')}
                    </Link>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Wait for auth to load before showing buttons */}
                    {isLoading ? (
                        <div className="w-24 h-8 bg-muted animate-pulse rounded-lg" />
                    ) : user ? (
                        <>
                            <Link
                                href="/profile"
                                className="text-muted-foreground hover:text-primary hidden lg:flex items-center gap-2 cursor-pointer transition-all duration-200 hover:bg-primary/5 px-3 py-1.5 rounded-lg"
                            >
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                {user.name} ({user.role})
                            </Link>

                            {/* Role based dashboard link */}
                            <Link
                                href={user.role === 'ADMIN' ? '/dashboard/admin' : user.role === 'INSTRUCTOR' ? '/dashboard/instructor' : '/dashboard/student'}
                                className="hidden sm:flex items-center gap-2 text-primary hover:text-blue-700 dark:hover:text-blue-300 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all duration-200"
                            >
                                <span>📊</span>
                                {t('header.dashboard')}
                            </Link>

                            <button
                                onClick={() => {
                                    logout();
                                    setTheme('light');
                                }}
                                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:from-red-600 hover:to-rose-700 transition-all duration-200"
                            >
                                {t('header.logout')}
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login" className="text-primary hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-all duration-200">{t('header.login')}</Link>
                            <Link href="/register" className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200">{t('header.register')}</Link>
                        </div>
                    )}
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
            </header>

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
    );
}

