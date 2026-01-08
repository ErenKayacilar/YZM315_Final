'use client';

import { useState, useEffect } from 'react';
import api from '../../../../utils/api';

interface User {
    id: number;
    name: string;
    email: string;
    createdAt: string;
}

export default function ApprovalsPage() {
    const [pendingInstructors, setPendingInstructors] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPendingInstructors();
    }, []);

    const fetchPendingInstructors = async () => {
        try {
            const res = await api.get('/admin/approvals/pending');
            setPendingInstructors(res.data);
        } catch (err) {
            console.error(err);
            setError('Bekleyen eğitmenler yüklenirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await api.post(`/admin/approvals/${id}/approve`);
            setPendingInstructors(prev => prev.filter(user => user.id !== id));
            // Optional: Show success toast
        } catch (err) {
            console.error(err);
            alert('Onaylama işlemi başarısız oldu.');
        }
    };

    const handleReject = async (id: number) => {
        if (!confirm('Bu eğitmeni reddetmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;

        try {
            await api.delete(`/admin/approvals/${id}/reject`);
            setPendingInstructors(prev => prev.filter(user => user.id !== id));
        } catch (err) {
            console.error(err);
            alert('Reddetme işlemi başarısız oldu.');
        }
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Eğitmen Onayları</h1>

            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {pendingInstructors.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow text-center text-gray-500 dark:text-slate-400">
                    Bekleyen eğitmen onayı bulunmamaktadır.
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">İsim</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Kayıt Tarihi</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                            {pendingInstructors.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => handleApprove(user.id)}
                                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-semibold px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-md transition-colors"
                                        >
                                            Onayla
                                        </button>
                                        <button
                                            onClick={() => handleReject(user.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-semibold px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-md transition-colors"
                                        >
                                            Reddet
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
