'use client';

import { useState } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('STUDENT');
    const router = useRouter();
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', { name, email, password, role });
            router.push('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || t('auth.registerFailed'));
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#020617] transition-colors duration-300 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/20"></div>
                <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-3xl dark:bg-purple-500/20"></div>
            </div>

            <div className="w-full max-w-md p-6 sm:p-8 bg-white/80 dark:bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700/50 transform transition-all duration-300 hover:shadow-2xl z-10">
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                        {t('header.title')}
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-2 font-medium">{t('auth.registerTitle')}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center shadow-sm">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">{t('auth.name')}</label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full text-base px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-900/50 dark:border-slate-700 dark:text-white dark:focus:border-blue-400 dark:placeholder-slate-500 transition-all duration-200"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">{t('auth.email')}</label>
                        <input
                            type="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-base px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-900/50 dark:border-slate-700 dark:text-white dark:focus:border-blue-400 dark:placeholder-slate-500 transition-all duration-200"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">{t('auth.password')}</label>
                        <input
                            type="password"
                            placeholder="********"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full text-base px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-900/50 dark:border-slate-700 dark:text-white dark:focus:border-blue-400 dark:placeholder-slate-500 transition-all duration-200"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">{t('auth.role')}</label>
                        <div className="relative">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full appearance-none text-base px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:bg-slate-900/50 dark:border-slate-700 dark:text-white dark:focus:border-blue-400 transition-all duration-200 cursor-pointer"
                            >
                                <option value="STUDENT">{t('enrollment.student')}</option>
                                <option value="INSTRUCTOR">{t('dashboard.instructor')}</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-slate-400">
                                <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                        {t('auth.registerButton')}
                    </button>

                    <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
                        {t('auth.hasAccount')}{' '}
                        <Link href="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                            {t('auth.loginButton')}
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

