'use client';

import { useEffect, useState, use } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useTranslation();
    const [course, setCourse] = useState<any>(null);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [completedLessons, setCompletedLessons] = useState<number[]>([]);

    const { id } = use(params);

    useEffect(() => {
        fetchCourse();
        fetchProgress();
    }, [id]);

    const fetchCourse = async () => {
        try {
            const res = await api.get(`/courses/${id}`);
            setCourse(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProgress = async () => {
        try {
            // Fetch completed lessons for this course
            const res = await api.get(`/progress/course/${id}`);
            // Note: We need individual lesson progress - for now using course progress
        } catch (err) {
            console.error(err);
        }
    };

    const handleContentClick = async (lessonId: number) => {
        try {
            await api.post('/progress/complete', { lessonId });
            setCompletedLessons([...completedLessons, lessonId]);
        } catch (err) {
            console.error('Progress kaydedilemedi');
        }
    };

    // Notes Logic
    const [activeTab, setActiveTab] = useState<'content' | 'notes'>('content');
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');

    useEffect(() => {
        if (activeTab === 'notes') {
            fetchNotes();
        }
    }, [activeTab, id]);

    const fetchNotes = async () => {
        try {
            const res = await api.get(`/courses/${id}/notes`);
            setNotes(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            const res = await api.post(`/courses/${id}/notes`, { content: newNote });
            setNotes([res.data, ...notes]);
            setNewNote('');
        } catch (err) {
            alert('Not kaydedilemedi.');
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        if (!confirm('Notu silmek istediginize emin misiniz?')) return;
        try {
            await api.delete(`/notes/${noteId}`);
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (err) {
            alert('Silinemedi.');
        }
    };

    const getContentIcon = (type: string) => {
        switch (type) {
            case 'VIDEO': return '🎥';
            case 'PDF': return '📄';
            case 'LIVE_LINK': return '📺';
            case 'TEXT': return '📝';
            default: return '📁';
        }
    };

    const getContentLabel = (type: string) => {
        switch (type) {
            case 'VIDEO': return 'Video';
            case 'PDF': return 'PDF';
            case 'LIVE_LINK': return 'Canlı Ders';
            case 'TEXT': return 'Metin';
            default: return type;
        }
    };

    const getContentButtonStyle = (type: string) => {
        switch (type) {
            case 'VIDEO': return 'bg-red-600 hover:bg-red-700';
            case 'PDF': return 'bg-orange-600 hover:bg-orange-700';
            case 'LIVE_LINK': return 'bg-green-600 hover:bg-green-700';
            default: return 'bg-blue-600 hover:bg-blue-700';
        }
    };

    if (loading) return <div className="p-10">{t('common.loading')}</div>;
    if (!course) return <div className="p-10">{t('course.courseNotFound')}</div>;

    return (
        <div className="p-4 sm:p-10 md:ml-64 max-w-7xl transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">{course.title}</h1>
                    <p className="text-gray-600 dark:text-gray-400">{course.description}</p>
                </div>
            </div>


            {/* Tabs */}
            <div className="flex gap-6 border-b border-border mb-8">
                <button
                    className={`pb-2 px-1 font-medium text-lg transition-colors ${activeTab === 'content' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('content')}
                >
                    {t('course.curriculum')}
                </button>
                <button
                    className={`pb-2 px-1 font-medium text-lg transition-colors ${activeTab === 'notes' ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveTab('notes')}
                >
                    Notlarım
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    {activeTab === 'content' ? (
                        <>
                            <h2 className="text-2xl font-bold border-b pb-2 border-border text-foreground">Ders İçeriği</h2>
                            {course.modules?.map((mod: any) => (
                                <div key={mod.id} className="card-google p-4 flex flex-col">
                                    <h3 className="font-bold text-lg mb-3 text-foreground">{mod.title}</h3>
                                    <ul className="space-y-3">
                                        {mod.lessons?.map((lesson: any) => (
                                            <li key={lesson.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{getContentIcon(lesson.type)}</span>
                                                    <div>
                                                        <p className="font-medium text-foreground">{lesson.title}</p>
                                                        <span className="text-xs text-muted-foreground">{getContentLabel(lesson.type)}</span>
                                                    </div>
                                                </div>
                                                <a
                                                    href={lesson.url}
                                                    target="_blank"
                                                    download={lesson.type === 'PDF'}
                                                    onClick={() => handleContentClick(lesson.id)}
                                                    className={`text-white px-4 py-2 rounded text-sm font-medium transition-colors ${getContentButtonStyle(lesson.type)}`}
                                                >
                                                    {lesson.type === 'PDF' ? 'PDF İndir / Aç' :
                                                        lesson.type === 'LIVE_LINK' ? 'Katıl' :
                                                            lesson.type === 'VIDEO' ? 'İzle' : 'Aç'}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                    {mod.lessons?.length === 0 && (
                                        <p className="text-sm text-gray-500 dark:text-slate-500">Henüz içerik yok.</p>
                                    )}
                                </div>
                            ))}
                            {(!course.modules || course.modules.length === 0) && (
                                <p className="text-gray-500">Henüz içerik eklenmemiş.</p>
                            )}
                        </>
                    ) : (
                        <div className="card-google p-6">
                            <h2 className="text-xl font-bold mb-4 dark:text-slate-100">Kişisel Notlarım</h2>
                            <div className="mb-6">
                                <textarea
                                    className="w-full p-4 border rounded-lg h-32 mb-2 input-google transition-colors"
                                    placeholder="Bu dersle ilgili not al..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                />
                                <button
                                    onClick={handleAddNote}
                                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                                >
                                    Notu Kaydet
                                </button>
                            </div>
                            <div className="space-y-4">
                                {notes.map(note => (
                                    <div key={note.id} className="p-4 rounded-lg border bg-card border-border shadow-sm relative group">
                                        <p className="whitespace-pre-wrap text-foreground">{note.content}</p>
                                        <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground">
                                            <span>{new Date(note.createdAt).toLocaleString()}</span>
                                            <button
                                                onClick={() => handleDeleteNote(note.id)}
                                                className="text-red-500 hover:text-red-700 font-medium opacity-100 transition-opacity flex items-center gap-1"
                                            >
                                                🗑 Sil
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {notes.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-4">Henüz notun yok.</p>}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <div className="card-google p-6">
                        <h2 className="text-xl font-bold mb-4 text-foreground">{t('course.exams')}</h2>
                        <div className="space-y-3">
                            {course.exams?.map((exam: any) => {
                                const userResult = exam.results?.[0];
                                const hasDeadline = exam.deadline;
                                const deadlinePassed = hasDeadline && new Date() > new Date(exam.deadline);
                                const deadlineDate = hasDeadline ? new Date(exam.deadline) : null;

                                return (
                                    <div key={exam.id} className="card-google p-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="dark:text-slate-200 font-medium">{exam.title}</span>
                                                {hasDeadline && (
                                                    <p className={`text-xs mt-1 ${deadlinePassed ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        📅 Son Tarih: {deadlineDate?.toLocaleDateString('tr-TR')} {deadlineDate?.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                )}
                                            </div>
                                            {userResult ? (
                                                <span className="text-green-700 font-bold bg-green-100 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded">
                                                    ✓ {userResult.score} Puan
                                                </span>
                                            ) : deadlinePassed ? (
                                                <span className="bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-3 py-1 rounded text-sm font-medium cursor-not-allowed">
                                                    ⏰ Süre Doldu (0 Puan)
                                                </span>
                                            ) : (
                                                <Link href={`/exams/${exam.id}`} className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
                                                    Başla
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {(!course.exams || course.exams.length === 0) && (
                                <p className="text-sm text-gray-500 dark:text-slate-400">Aktif sınav yok.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

