'use client';

import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { Course } from '../../../types';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function InstructorDashboard() {
    const { t } = useTranslation();
    const [courses, setCourses] = useState<Course[]>([]);
    const [newCourseTitle, setNewCourseTitle] = useState('');
    const [newCourseDesc, setNewCourseDesc] = useState('');
    const [hasLab, setHasLab] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses/my-courses');
            setCourses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/courses', { title: newCourseTitle, description: newCourseDesc, hasLab });
            setNewCourseTitle('');
            setNewCourseDesc('');
            setHasLab(false);
            fetchCourses();
        } catch (err) {
            alert(t('dashboard.courseCreationFailed'));
        }
    };

    return (
        <div className="p-4 sm:p-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t('dashboard.instructorTitle')}
            </h1>

            <div className="mb-10 p-6 card-glow">
                <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    {t('dashboard.createCourse')}
                </h2>
                <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder={t('dashboard.courseTitle')}
                            value={newCourseTitle}
                            onChange={(e) => setNewCourseTitle(e.target.value)}
                            className="border p-3 rounded-xl flex-1 input-google"
                            required
                        />
                        <input
                            type="text"
                            placeholder={t('dashboard.courseDescription')}
                            value={newCourseDesc}
                            onChange={(e) => setNewCourseDesc(e.target.value)}
                            className="border p-3 rounded-xl flex-1 input-google"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={hasLab}
                                onChange={(e) => setHasLab(e.target.checked)}
                                className="w-5 h-5 accent-purple-600 rounded"
                            />
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                                🧪 Bu dersin Laboratuvarı var mı?
                            </span>
                        </label>
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:-translate-y-0.5"
                        >
                            {t('common.create')}
                        </button>
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div key={course.id} className="card-google p-6 group">
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
                        <p className="text-muted-foreground mb-4 line-clamp-2">{course.description}</p>
                        <Link
                            href={`/dashboard/instructor/courses/${course.id}`}
                            className="inline-flex items-center gap-2 text-primary hover:text-blue-700 font-medium group-hover:gap-3 transition-all duration-200"
                        >
                            {t('common.manage')}
                            <span className="transition-transform group-hover:translate-x-1">→</span>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
