'use client';

import { useAuth } from '../../context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const pathname = usePathname();
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) return null;

    const isInstructor = user.role === 'INSTRUCTOR';
    const isAdmin = user.role === 'ADMIN';
    const isStudent = user.role === 'STUDENT';

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
    ];

    let links = studentLinks;
    if (isAdmin) links = adminLinks;
    else if (isInstructor) links = instructorLinks;

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    return (
        <div className="flex min-h-[calc(100vh-80px)]">
            {/* Desktop Sidebar - Premium Glass Effect */}
            <aside className="hidden md:flex md:flex-col md:w-64 glass-effect border-r border-border/50 shrink-0 transition-all duration-300">
                {/* User Info - Clickable to go to profile */}
                <Link
                    href="/profile"
                    className="group block p-5 border-b border-border/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        {user.profileImage ? (
                            <img
                                src={user.profileImage}
                                alt="Profile"
                                className="w-12 h-12 rounded-full object-cover shadow-md ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{user.name}</p>
                            <p className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full inline-block">
                                {user.role === 'STUDENT' ? '🎓 Öğrenci' : user.role === 'INSTRUCTOR' ? '👨‍🏫 Eğitmen' : '🛡️ Admin'}
                            </p>
                        </div>
                    </div>
                </Link>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {links.map((link, index) => (
                        <Link
                            key={link.href + link.label + index}
                            href={link.href}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative overflow-hidden
                                ${isActive(link.href)
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30 font-semibold'
                                    : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground hover:shadow-md hover:shadow-blue-500/10'
                                }
                            `}
                        >
                            <span className="text-xl">{link.icon}</span>
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                        ✨ LMS Platform v1.0
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-background/50 overflow-auto">
                {children}
            </main>
        </div>
    );
}
