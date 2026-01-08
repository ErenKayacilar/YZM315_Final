'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user } = useAuth();
    const pathname = usePathname();
    const { t } = useTranslation();

    // Don't show sidebar on login/register pages
    if (!user || pathname === '/login' || pathname === '/register') return null;

    // Check if we're on a dashboard page (sidebar is handled by dashboard layout on desktop)
    const isDashboard = pathname.startsWith('/dashboard');

    const isInstructor = user.role === 'INSTRUCTOR';
    const isAdmin = user.role === 'ADMIN';

    const instructorLinks = [
        { href: '/dashboard/instructor', label: t('sidebar.dashboard'), icon: '🏠' },
        { href: '/dashboard/instructor', label: t('sidebar.courses'), icon: '📚' },
    ];

    const studentLinks = [
        { href: '/dashboard/student', label: t('sidebar.dashboard'), icon: '🏠' },
        { href: '/dashboard/student', label: t('sidebar.courses'), icon: '📚' },
    ];

    const adminLinks = [
        { href: '/dashboard/admin', label: 'Admin Paneli', icon: '🛡️' },
        { href: '/dashboard/admin/approvals', label: 'Eğitmen Onayları', icon: '✅' },
    ];

    let links = studentLinks;
    if (isAdmin) links = adminLinks;
    else if (isInstructor) links = instructorLinks;

    const isActive = (href: string) => pathname === href;

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            {/* Mobile Sidebar (slides in) - Show on all pages when hamburger clicked */}
            {/* Desktop Sidebar - Only show when NOT on dashboard (dashboard has its own sidebar) */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-64 bg-card shadow-xl z-50 md:z-40 md:pt-24
                    transform transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${isDashboard ? '' : 'md:translate-x-0 md:shadow-none md:border-r md:border-border'}
                `}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center md:hidden">
                    <Link href="/" className="font-bold text-xl text-blue-800 dark:text-blue-400">
                        {t('header.title')}
                    </Link>
                    <button
                        onClick={onClose}
                        className="md:hidden text-gray-500 hover:text-gray-700 dark:text-slate-400"
                    >
                        ✕
                    </button>
                </div>

                {/* User Info */}
                <Link
                    href="/profile"
                    onClick={(e) => {
                        e.stopPropagation();
                        console.log('Navigating to profile');
                        onClose();
                    }}
                    className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                    {user.profileImage ? (
                        <img
                            src={user.profileImage}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                            {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                    )}
                    <div>
                        <p className="font-semibold text-gray-800 dark:text-slate-200">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{user.role}</p>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {links.map((link) => (
                        <Link
                            key={link.href + link.label}
                            href={link.href}
                            onClick={onClose}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                ${isActive(link.href)
                                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold'
                                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                                }
                            `}
                        >
                            <span className="text-xl">{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-slate-700">
                    <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
                        LMS Platform v1.0
                    </p>
                </div>
            </aside>
        </>
    );
}
