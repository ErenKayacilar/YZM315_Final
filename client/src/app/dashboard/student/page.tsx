'use client';

import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface CourseWithProgress {
    id: number;
    title: string;
    description?: string;
    hasLab?: boolean;
    userStatus?: string;
    progress?: number;
    instructor?: { name: string };
    theoryScore?: number;
    labScore?: number;
}

export default function StudentDashboard() {
    const { t } = useTranslation();
    const [courses, setCourses] = useState<CourseWithProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            // API now includes theoryScore and labScore directly
            const res = await api.get('/courses');
            const coursesData = res.data;

            // Fetch progress for each approved course
            const coursesWithProgress = await Promise.all(
                coursesData.map(async (course: CourseWithProgress) => {
                    if (course.userStatus === 'APPROVED') {
                        try {
                            const progressRes = await api.get(`/progress/course/${course.id}`);
                            return {
                                ...course,
                                progress: progressRes.data.progress
                            };
                        } catch {
                            return {
                                ...course,
                                progress: 0
                            };
                        }
                    }
                    return course;
                })
            );

            setCourses(coursesWithProgress);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleEnroll = async (courseId: number) => {
        try {
            await api.post(`/courses/${courseId}/enroll`);
            alert(t('dashboard.requestSent'));
            fetchCourses();
        } catch (err: any) {
            alert(err.response?.data?.message || t('dashboard.requestFailed'));
        }
    };

    if (loading) return <div className="p-10">{t('common.loading')}</div>;

    return (
        <div className="p-4 sm:p-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t('dashboard.studentTitle')}
            </h1>

            <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                <span className="text-2xl">📚</span>
                {t('dashboard.availableCourses')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course.id} className="card-google p-6 flex flex-col group">
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                {course.title}
                            </h3>
                            {course.hasLab && (
                                <span className="badge-premium text-xs">
                                    🧪 Lab
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground mb-3 flex-1 line-clamp-2">{course.description}</p>
                        <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
                            <span className="opacity-75">👨‍🏫</span>
                            {course.instructor?.name}
                        </p>

                        {/* Progress Bar - Only for approved courses */}
                        {course.userStatus === 'APPROVED' && typeof course.progress === 'number' && (
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">{t('dashboard.progress') || 'İlerleme'}</span>
                                    <span className="font-semibold text-green-600 dark:text-green-400">%{course.progress}</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-500 animate-shimmer"
                                        style={{ width: `${course.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Scores Display - Only for approved courses */}
                        {course.userStatus === 'APPROVED' && (course.theoryScore !== undefined || course.labScore !== undefined) && (
                            <div className="mb-4 p-3 card-glow">
                                <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-1">
                                    📊 Notlarınız
                                </p>
                                <div className="flex gap-4 text-sm">
                                    {course.theoryScore !== undefined && (
                                        <span className="text-foreground flex items-center gap-1">
                                            📝 <strong className="text-blue-600 dark:text-blue-400">{course.theoryScore}</strong>
                                        </span>
                                    )}
                                    {course.hasLab && course.labScore !== undefined && (
                                        <span className="text-foreground flex items-center gap-1">
                                            🧪 <strong className="text-purple-600 dark:text-purple-400">{course.labScore}</strong>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-auto">
                            {course.userStatus === 'APPROVED' && (
                                <Link
                                    href={`/courses/${course.id}`}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl block text-center font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:-translate-y-0.5"
                                >
                                    {t('dashboard.enterCourse')} →
                                </Link>
                            )}
                            {course.userStatus === 'PENDING' && (
                                <button disabled className="bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-900 px-4 py-2.5 rounded-xl w-full font-semibold cursor-not-allowed shadow-lg shadow-amber-500/20">
                                    ⏳ {t('dashboard.pendingApproval')}
                                </button>
                            )}
                            {course.userStatus === 'REJECTED' && (
                                <div className="text-red-600 font-bold text-center border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-800 p-3 rounded-xl flex items-center justify-center gap-2">
                                    ❌ {t('dashboard.accessDenied')}
                                </div>
                            )}
                            {!course.userStatus && (
                                <button
                                    onClick={() => handleEnroll(course.id)}
                                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl w-full font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 hover:-translate-y-0.5"
                                >
                                    {t('dashboard.sendRequest')}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
