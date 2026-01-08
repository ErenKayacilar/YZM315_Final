'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../utils/api';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Role } from '../../../types';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, user } = useAuth();
    const [error, setError] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');

    useEffect(() => {
        if (user && redirectUrl) {
            router.push(redirectUrl);
        }
    }, [user, redirectUrl, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/login', { email, password });
            const { token, user: userData } = res.data;

            // Use AuthContext login which handles localStorage and redirect
            login(token, userData);

            // If there's a custom redirect URL, use it
            if (redirectUrl) {
                router.push(redirectUrl);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('auth.loginFailed'));
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#020617] transition-colors duration-300 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/20"></div>
                <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/20"></div>
            </div>

            <div className="w-full max-w-md p-6 sm:p-8 bg-white/80 dark:bg-[#1e293b]/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700/50 transform transition-all duration-300 hover:shadow-2xl z-10">
                <div className="text-center mb-8">
                    <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-blue-400">
                        {t('header.title')}
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400 mt-2 font-medium">{t('auth.loginTitle')}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center shadow-sm">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">{t('auth.email')}</label>
                        <input
                            type="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-base px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:bg-slate-900/50 dark:border-slate-700 dark:text-white dark:focus:border-indigo-400 dark:placeholder-slate-500 transition-all duration-200"
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
                            className="w-full text-base px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:bg-slate-900/50 dark:border-slate-700 dark:text-white dark:focus:border-indigo-400 dark:placeholder-slate-500 transition-all duration-200"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                    >
                        {t('auth.loginButton')}
                    </button>

                    <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
                        {t('auth.noAccount')}{' '}
                        <Link href="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                            {t('auth.registerButton')}
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

