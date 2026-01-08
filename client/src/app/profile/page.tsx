'use client';

import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [password, setPassword] = useState('');
    const [profileImage, setProfileImage] = useState(user?.profileImage || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('file', file);

            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setProfileImage(res.data.url);
        } catch (error) {
            console.error('File upload failed:', error);
            setMessage({ type: 'error', text: 'Dosya yüklenemedi.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const updateData: any = {
                name,
                email,
                phoneNumber,
                profileImage,
            };

            if (password) {
                updateData.password = password;
            }

            await api.put('/users/profile', updateData);

            // Refresh user context to update sidebar and header
            await refreshUser();

            setMessage({ type: 'success', text: 'Profil güncellendi.' });
            setPassword(''); // Clear password field
        } catch (error) {
            console.error('Update failed:', error);
            setMessage({ type: 'error', text: 'Güncelleme başarısız.' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 dark:text-white">Profil Ayarları</h1>

            {message && (
                <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="bg-[var(--card)] rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <form onSubmit={handleSave} className="space-y-6">
                    {/* Avatar */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-4xl font-bold text-blue-600 dark:text-blue-300 border-4 border-white dark:border-slate-700 shadow-md">
                                    {name?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-medium text-sm">Değiştir</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                            Profil fotoğrafını değiştirmek için tıklayın
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Ad Soyad</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-[var(--background)] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">E-posta</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-[var(--background)] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Telefon Numarası</label>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+90 555 555 55 55"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-[var(--background)] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Yeni Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Değiştirmek istemiyorsanız boş bırakın"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-[var(--background)] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
