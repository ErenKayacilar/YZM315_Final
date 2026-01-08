'use client';

import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
    totalUsers: number;
    totalCourses: number;
    totalQuestions: number;
    totalExams: number;
    totalStudents: number;
    totalInstructors: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    _count: {
        courses: number;
        enrollments: number;
    };
}

interface Course {
    id: number;
    title: string;
    description: string;
    instructor: {
        id: number;
        name: string;
        email: string;
    };
    _count: {
        enrollments: number;
        exams: number;
        modules: number;
    };
}

export default function AdminDashboard() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses'>('overview');
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    // Redirect non-admin users
    useEffect(() => {
        if (!authLoading && user && user.role !== 'ADMIN') {
            router.push(`/dashboard/${user.role.toLowerCase()}`);
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!authLoading && user?.role === 'ADMIN') {
            fetchStats();
        }
    }, [user, authLoading]);

    useEffect(() => {
        if (activeTab === 'users' && users.length === 0) {
            fetchUsers();
        }
        if (activeTab === 'courses' && courses.length === 0) {
            fetchCourses();
        }
    }, [activeTab]);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Stats alınamadı:', err);
            setLoading(false);
        }
    };

    // ... (fetchUsers, fetchCourses, handleDeleteUser, handleDeleteCourse)

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error('Kullanıcılar alınamadı:', err);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/admin/courses');
            setCourses(res.data);
        } catch (err) {
            console.error('Dersler alınamadı:', err);
        }
    };

    const handleDeleteUser = async (userId: number) => {
        if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            alert('Kullanıcı silinemedi');
        }
    };

    const handleDeleteCourse = async (courseId: number) => {
        if (!confirm('Bu dersi silmek istediğinize emin misiniz? Tüm içerikler silinecektir.')) return;
        try {
            await api.delete(`/admin/courses/${courseId}`);
            setCourses(courses.filter(c => c.id !== courseId));
            fetchStats(); // Refresh stats
        } catch (err) {
            alert('Ders silinemedi');
        }
    };

    const getRoleBadge = (role: string) => {
        const badges: Record<string, string> = {
            'ADMIN': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            'INSTRUCTOR': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            'STUDENT': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        };
        return badges[role] || 'bg-gray-100 text-gray-800';
    };

    if (authLoading) {
        return <div className="p-10 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div></div>;
    }

    if (!user || user.role !== 'ADMIN') {
        return <div className="p-10">Yetkiniz yok...</div>;
    }

    if (loading) {
        return <div className="p-10">Yükleniyor...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#202124]">
            {/* Admin Header */}
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold">🛡️ Admin Dashboard</h1>
                    <p className="opacity-80 mt-1">Sistem Yönetim Paneli</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Tabs */}
                <div className="flex gap-4 border-b dark:border-slate-700 mb-8">
                    <button
                        className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'overview' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600 dark:text-gray-400'}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Genel Bakış
                    </button>
                    <button
                        className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'users' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600 dark:text-gray-400'}`}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 Kullanıcılar
                    </button>
                    <button
                        className={`pb-3 px-4 font-medium transition-colors ${activeTab === 'courses' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600 dark:text-gray-400'}`}
                        onClick={() => setActiveTab('courses')}
                    >
                        📚 Dersler
                    </button>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white dark:bg-[#303134] rounded-xl p-6 shadow-lg border-l-4 border-blue-500">
                                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</div>
                                <div className="text-gray-600 dark:text-gray-400 mt-1">Toplam Kullanıcı</div>
                            </div>
                            <div className="bg-white dark:bg-[#303134] rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                                <div className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.totalCourses}</div>
                                <div className="text-gray-600 dark:text-gray-400 mt-1">Toplam Ders</div>
                            </div>
                            <div className="bg-white dark:bg-[#303134] rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
                                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.totalExams}</div>
                                <div className="text-gray-600 dark:text-gray-400 mt-1">Toplam Sınav</div>
                            </div>
                            <div className="bg-white dark:bg-[#303134] rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
                                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">{stats.totalQuestions}</div>
                                <div className="text-gray-600 dark:text-gray-400 mt-1">Toplam Soru</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-[#303134] rounded-xl p-6 shadow-lg">
                                <h3 className="text-xl font-bold mb-4 dark:text-slate-100">👨‍🏫 Eğitmenler</h3>
                                <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">{stats.totalInstructors}</div>
                            </div>
                            <div className="bg-white dark:bg-[#303134] rounded-xl p-6 shadow-lg">
                                <h3 className="text-xl font-bold mb-4 dark:text-slate-100">👨‍🎓 Öğrenciler</h3>
                                <div className="text-5xl font-bold text-green-600 dark:text-green-400">{stats.totalStudents}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="bg-white dark:bg-[#303134] rounded-xl shadow-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-[#404040]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İsim</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dersler</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#404040]">
                                        <td className="px-6 py-4 whitespace-nowrap dark:text-slate-200">{u.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{u.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${getRoleBadge(u.role)}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                            {u.role === 'INSTRUCTOR' ? u._count.courses : u._count.enrollments}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {u.role !== 'ADMIN' && (
                                                <button
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    🗑️ Sil
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="text-center py-8 text-gray-500">Kullanıcı bulunamadı</div>
                        )}
                    </div>
                )}

                {/* Courses Tab */}
                {activeTab === 'courses' && (
                    <div className="bg-white dark:bg-[#303134] rounded-xl shadow-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-[#404040]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ders Adı</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Eğitmen</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Öğrenci</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sınav</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {courses.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-[#404040]">
                                        <td className="px-6 py-4 whitespace-nowrap dark:text-slate-200 font-medium">{c.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{c.instructor?.name || 'Belirtilmemiş'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{c._count.enrollments}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">{c._count.exams}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleDeleteCourse(c.id)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                🗑️ Sil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {courses.length === 0 && (
                            <div className="text-center py-8 text-gray-500">Ders bulunamadı</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
