'use client';

import { useEffect, useState, use } from 'react';
import api from '../../../../../utils/api';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import QuestionEditor from '../../../../../components/QuestionEditor';

export default function InstructorCourseDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { t } = useTranslation();
    const [course, setCourse] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'curriculum' | 'exams' | 'requests' | 'bank' | 'notes' | 'gradebook'>('curriculum');
    const [loading, setLoading] = useState(true);

    // Enrollments State
    const [enrollments, setEnrollments] = useState<any[]>([]);

    // Exam Results State
    const [showResultsFor, setShowResultsFor] = useState<number | null>(null);
    const [examResults, setExamResults] = useState<any[]>([]);

    // Forms State
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [newLesson, setNewLesson] = useState({ title: '', type: 'VIDEO', url: '', moduleId: 0 });
    const [showLessonForm, setShowLessonForm] = useState<number | null>(null);

    // Module Edit State
    const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
    const [editModuleTitle, setEditModuleTitle] = useState('');

    // Exam Form State
    const [showExamForm, setShowExamForm] = useState(false);
    const [newExamTitle, setNewExamTitle] = useState('');
    const [questions, setQuestions] = useState<any[]>([]); // Start with empty - no placeholder
    const [bankQuestions, setBankQuestions] = useState<any[]>([]);
    const [showBankModal, setShowBankModal] = useState(false);
    const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState<number[]>([]);
    const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
    const [randomCount, setRandomCount] = useState(5);
    const [filterQuestionType, setFilterQuestionType] = useState<string>('ALL'); // Question type filter
    const [requiresSeb, setRequiresSeb] = useState(false); // Safe Exam Browser required
    const [examDuration, setExamDuration] = useState<number | null>(null); // Exam duration in minutes
    const [examDeadline, setExamDeadline] = useState<string>(''); // Exam deadline

    // Excel Import State
    const [importLoading, setImportLoading] = useState(false);

    // Instructor Notes State
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState('');

    // Gradebook State
    const [editingGrades, setEditingGrades] = useState<{ [key: number]: { theoryScore?: number, labScore?: number } }>({});
    const [savingGrade, setSavingGrade] = useState<number | null>(null);
    const [editingRows, setEditingRows] = useState<Set<number>>(new Set());
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const fetchCourse = async () => {
        try {
            const res = await api.get(`/courses/${id}`);
            setCourse(res.data);
            setLoading(false);
        } catch (err) {
            alert('Ders yuklenemedi');
        }
    };

    const fetchEnrollments = async () => {
        try {
            const res = await api.get(`/courses/${id}/enrollments`);
            setEnrollments(res.data);
        } catch (err) {
            alert('Kayitlar alinamadi');
        }
    };

    // Tab değiştiğinde data çek
    useEffect(() => {
        if (activeTab === 'requests' || activeTab === 'gradebook') {
            fetchEnrollments();
        }
        if (activeTab === 'notes') {
            fetchNotes();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'bank' || showBankModal || isRandomModalOpen) {
            fetchBankQuestions();
        }
    }, [activeTab, showBankModal, isRandomModalOpen]);

    // Notes Functions
    const fetchNotes = async () => {
        try {
            const res = await api.get(`/courses/${id}/notes`);
            setNotes(res.data);
        } catch (err) {
            console.error('Notlar alinamadi', err);
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
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/notes/${noteId}`);
            setNotes(notes.filter(n => n.id !== noteId));
        } catch (err) {
            alert('Silinemedi.');
        }
    };

    const fetchBankQuestions = async () => {
        try {
            const res = await api.get(`/questions/course/${id}`);
            setBankQuestions(res.data);
        } catch (err) {
            console.error('Bank sorulari alinamadi', err);
        }
    };

    const handleUpdateEnrollment = async (studentId: number, status: 'APPROVED' | 'REJECTED') => {
        try {
            await api.patch(`/courses/${id}/enrollments/${studentId}`, { status });
            fetchEnrollments();
        } catch (err) {
            alert('Guncellenemedi');
        }
    };

    const fetchExamResults = async (examId: number) => {
        if (showResultsFor === examId) {
            setShowResultsFor(null);
            return;
        }
        try {
            const res = await api.get(`/exams/${examId}/results`);
            setExamResults(res.data);
            setShowResultsFor(examId);
        } catch (err) {
            alert('Sonuclar alinamadi.');
        }
    };

    const handleAddModule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/courses/${id}/modules`, { title: newModuleTitle });
            setNewModuleTitle('');
            fetchCourse();
        } catch (err) {
            alert('Modul eklenemedi');
        }
    };

    const handleAddLesson = async (e: React.FormEvent, moduleId: number) => {
        e.preventDefault();
        try {
            let finalUrl = newLesson.url;

            if ((newLesson.type === 'PDF' || newLesson.type === 'VIDEO') && uploadFile) {
                const formData = new FormData();
                formData.append('file', uploadFile);
                // Important: Let browser set Content-Type for FormData
                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalUrl = uploadRes.data.url;
            }

            await api.post(`/courses/modules/${moduleId}/lessons`, {
                title: newLesson.title,
                type: newLesson.type,
                url: finalUrl
            });
            setNewLesson({ title: '', type: 'VIDEO', url: '', moduleId: 0 });
            setUploadFile(null);
            setShowLessonForm(null);
            fetchCourse();
        } catch (err) {
            console.error(err);
            alert('Ders eklenemedi');
        }
    };

    // Modül Düzenleme
    const handleEditModule = (mod: any) => {
        setEditingModuleId(mod.id);
        setEditModuleTitle(mod.title);
    };

    const handleSaveModuleEdit = async (moduleId: number) => {
        try {
            await api.put(`/courses/modules/${moduleId}`, { title: editModuleTitle });
            setEditingModuleId(null);
            setEditModuleTitle('');
            fetchCourse();
        } catch (err) {
            alert('Modul guncellenemedi');
        }
    };

    const handleDeleteModule = async (moduleId: number) => {
        if (!confirm('Bu modülü ve tüm içeriklerini silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/courses/modules/${moduleId}`);
            fetchCourse();
        } catch (err) {
            alert('Modul silinemedi');
        }
    };

    const handleDeleteLesson = async (lessonId: number) => {
        if (!confirm('Bu içeriği silmek istediğinize emin misiniz?')) return;
        try {
            await api.delete(`/courses/lessons/${lessonId}`);
            fetchCourse();
        } catch (err) {
            alert('Icerik silinemedi');
        }
    };

    const handleAddQuestion = () => {
        // Add default question structure
        setQuestions([...questions, {
            text: '',
            type: 'MULTIPLE_CHOICE',
            structure: { options: [{ text: '', id: Date.now() }, { text: '', id: Date.now() + 1 }] },
            answerKey: ''
        }]);
    };

    const updateQuestionData = (index: number, data: any) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...data };
        setQuestions(newQuestions);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    // Bank Functions
    const handleAddBankQuestion = async (questionData: any) => {
        try {
            await api.post(`/questions/course/${id}`, questionData);
            fetchBankQuestions();
            alert('Soru bankaya eklendi');
        } catch (err) {
            alert('Soru eklenemedi');
        }
    };

    const handleDeleteBankQuestion = async (qId: number) => {
        if (!confirm('Bu soruyu bankadan silmek istediginize emin misiniz?')) return;
        try {
            await api.delete(`/questions/${qId}`);
            fetchBankQuestions();
        } catch (err) {
            alert('Silinemedi');
        }
    };

    // Excel Template Download
    const handleDownloadTemplate = () => {
        // Create template data
        const templateData = [
            {
                Type: 'MULTIPLE_CHOICE',
                Content: '2+2 kaç eder?',
                Options: '["3", "4", "5", "6"]',
                CorrectAnswer: '4'
            },
            {
                Type: 'TRUE_FALSE',
                Content: 'Dünya yuvarlaktır',
                Options: '["Doğru", "Yanlış"]',
                CorrectAnswer: 'Doğru'
            },
            {
                Type: 'SHORT_ANSWER',
                Content: 'Türkiye\'nin başkenti neresidir?',
                Options: '',
                CorrectAnswer: 'Ankara'
            }
        ];

        // Create workbook manually using CSV format (no xlsx dependency on frontend)
        const headers = ['Type', 'Content', 'Options', 'CorrectAnswer'];
        const csvContent = [
            headers.join(','),
            ...templateData.map(row =>
                `${row.Type},"${row.Content}","${row.Options}","${row.CorrectAnswer}"`
            )
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'soru_sablonu.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Excel Import
    const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file extension
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!validExtensions.includes(fileExtension)) {
            alert('Lütfen geçerli bir Excel dosyası (.xlsx, .xls) veya CSV dosyası seçin');
            return;
        }

        setImportLoading(true);

        try {
            // Read file as base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const base64 = (e.target?.result as string).split(',')[1];

                    const response = await api.post(`/questions/course/${id}/import`, {
                        fileData: base64
                    });

                    const result = response.data;

                    if (result.success) {
                        let message = `✅ ${result.inserted} soru başarıyla eklendi!`;
                        if (result.errors && result.errors.length > 0) {
                            message += `\n\n⚠️ ${result.failedRows} satırda hata:\n${result.errors.slice(0, 5).join('\n')}`;
                            if (result.errors.length > 5) {
                                message += `\n...ve ${result.errors.length - 5} hata daha`;
                            }
                        }
                        alert(message);
                        fetchBankQuestions(); // Refresh the list
                    } else {
                        alert('Import başarısız: ' + (result.error || 'Bilinmeyen hata'));
                    }
                } catch (err: any) {
                    console.error('Import error:', err);
                    alert('Yükleme hatası: ' + (err.response?.data?.error || err.message));
                } finally {
                    setImportLoading(false);
                }
            };
            reader.onerror = () => {
                alert('Dosya okunamadı');
                setImportLoading(false);
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('File read error:', err);
            alert('Dosya işlenemedi');
            setImportLoading(false);
        }

        // Reset input
        event.target.value = '';
    };

    // Add selected bank questions to the NEW EXAM form
    const handleAddFromBankToForm = () => {
        const selectedQuestions = bankQuestions.filter(q => selectedBankQuestionIds.includes(q.id));
        // Transform to form format using new schema
        const newFormQuestions = selectedQuestions.map(q => ({
            text: q.text,
            type: q.type,
            structure: q.structure,
            answerKey: q.answerKey
        }));

        // Simply add to existing questions (starts from empty)
        setQuestions([...questions, ...newFormQuestions]);

        setShowBankModal(false);
        setSelectedBankQuestionIds([]);
        setFilterQuestionType('ALL'); // Reset filter
    };

    const handleAddRandomToForm = () => {
        // Filter by selected type first
        const filteredQuestions = bankQuestions.filter(q =>
            filterQuestionType === 'ALL' || q.type === filterQuestionType
        );

        const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, randomCount);

        const newFormQuestions = selected.map(q => ({
            text: q.text,
            type: q.type,
            structure: q.structure,
            answerKey: q.answerKey
        }));

        // Simply add to existing questions (starts from empty)
        setQuestions([...questions, ...newFormQuestions]);

        setIsRandomModalOpen(false);
        setFilterQuestionType('ALL'); // Reset filter
    };

    const handleShuffleOptions = () => {
        // Shuffle options within the structure for MULTIPLE_CHOICE type questions
        const shuffledQuestions = questions.map(q => {
            if (q.type === 'MULTIPLE_CHOICE' || q.type === 'MULTIPLE_SELECT') {
                const currentStructure = q.structure || { options: [] };
                const shuffledOptions = [...(currentStructure.options || [])].sort(() => Math.random() - 0.5);
                return { ...q, structure: { ...currentStructure, options: shuffledOptions } };
            }
            return q;
        });
        setQuestions(shuffledQuestions);
    };

    const handleToggleExamForm = () => {
        if (showExamForm) {
            // Closing form - Reset to empty
            setShowExamForm(false);
            setNewExamTitle('');
            setQuestions([]); // Start fresh with no placeholder
        } else {
            // Opening form
            setShowExamForm(true);
        }
    };

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/exams', {
                title: newExamTitle,
                courseId: Number(id),
                questions,
                requiresSeb,
                duration: examDuration,
                deadline: examDeadline || null
            });
            setShowExamForm(false);
            setNewExamTitle('');
            setQuestions([]);
            setRequiresSeb(false);
            setExamDuration(null);
            setExamDeadline('');
            fetchCourse();
        } catch (err) {
            alert('Sinav olusturulamadi');
        }
    }

    if (loading) return <div className="p-10">{t('common.loading')}</div>;
    if (!course) return <div className="p-10">{t('course.courseNotFound')}</div>;

    return (
        <div className="p-10 max-w-5xl mx-auto mb-20">
            <h1 className="text-3xl font-bold mb-2">{course.title} (Yonetim)</h1>
            <p className="text-gray-600 mb-6">{course.description}</p>

            <div className="flex flex-nowrap gap-2 sm:gap-4 border-b dark:border-slate-800 mb-6 overflow-x-auto hide-scrollbar">
                <button
                    className={`pb-2 px-2 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'curriculum' ? 'border-b-2 border-blue-600 font-bold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400'}`}
                    onClick={() => setActiveTab('curriculum')}
                >
                    {t('course.curriculum')}
                </button>
                <button
                    className={`pb-2 px-2 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'exams' ? 'border-b-2 border-blue-600 font-bold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400'}`}
                    onClick={() => setActiveTab('exams')}
                >
                    {t('course.exams')}
                </button>
                <button
                    className={`pb-2 px-2 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'requests' ? 'border-b-2 border-blue-600 font-bold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400'}`}
                    onClick={() => setActiveTab('requests')}
                >
                    {t('course.requests')}
                </button>
                <button
                    className={`pb-2 px-2 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'bank' ? 'border-b-2 border-blue-600 font-bold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400'}`}
                    onClick={() => setActiveTab('bank')}
                >
                    {t('course.questionBank')}
                </button>
                <button
                    className={`pb-2 px-2 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'notes' ? 'border-b-2 border-blue-600 font-bold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-slate-400'}`}
                    onClick={() => setActiveTab('notes')}
                >
                    📝 Özel Notlarım
                </button>
                <button
                    className={`pb-2 px-2 sm:px-4 text-sm sm:text-base whitespace-nowrap ${activeTab === 'gradebook' ? 'border-b-2 border-green-600 font-bold text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'}`}
                    onClick={() => { setActiveTab('gradebook'); fetchEnrollments(); }}
                >
                    📊 Öğrenci Puanları
                </button>
            </div>

            {activeTab === 'curriculum' && (
                <div>
                    {/* Yeni Modül Ekle */}

                    <div className="mb-8 p-4 card-google">
                        <form onSubmit={handleAddModule} className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Yeni Modul Basligi"
                                value={newModuleTitle}
                                onChange={(e) => setNewModuleTitle(e.target.value)}

                                className="flex-1 p-2 border rounded input-google transition-colors duration-200"
                                required

                            />
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Modul Ekle</button>
                        </form>
                    </div>

                    {/* Modül Listesi */}
                    <div className="space-y-6">
                        {course.modules?.map((mod: any) => (

                            <div key={mod.id} className="card-google p-6">
                                <div className="flex justify-between items-center mb-4">
                                    {editingModuleId === mod.id ? (
                                        <div className="flex items-center gap-2 flex-1">
                                            <input
                                                type="text"
                                                value={editModuleTitle}
                                                onChange={(e) => setEditModuleTitle(e.target.value)}
                                                className="flex-1 p-2 border rounded input-google"
                                            />
                                            <button
                                                onClick={() => handleSaveModuleEdit(mod.id)}
                                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={() => setEditingModuleId(null)}
                                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 className="text-xl font-bold dark:text-slate-100">{mod.title}</h3>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {editingModuleId !== mod.id && (
                                            <>
                                                <button
                                                    onClick={() => handleEditModule(mod)}
                                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600"
                                                    title="Düzenle"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteModule(mod.id)}
                                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600"
                                                    title="Sil"
                                                >
                                                    🗑️
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => setShowLessonForm(mod.id === showLessonForm ? null : mod.id)}
                                            className="text-sm text-blue-600 dark:text-blue-400 ml-2"
                                        >
                                            + İçerik Ekle
                                        </button>
                                    </div>
                                </div>

                                {/* Ders Ekleme Formu */}
                                {showLessonForm === mod.id && (
                                    <form onSubmit={(e) => handleAddLesson(e, mod.id)} className="mb-4 p-4 card-google">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                            <input

                                                type="text" placeholder="İçerik Başlığı"
                                                className="p-2 border rounded input-google transition-colors duration-200"
                                                value={newLesson.title} onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                                                required
                                            />
                                            <select

                                                className="p-2 border rounded input-google transition-colors duration-200"
                                                value={newLesson.type} onChange={e => setNewLesson({ ...newLesson, type: e.target.value })}
                                            >
                                                <option value="VIDEO">🎥 Video</option>
                                                <option value="PDF">📄 PDF</option>
                                                <option value="LIVE_LINK">📺 Canlı Ders (Zoom/Meet)</option>
                                                <option value="TEXT">📝 Metin</option>
                                            </select>

                                            {newLesson.type === 'PDF' || newLesson.type === 'VIDEO' ? (
                                                <input
                                                    type="file"
                                                    accept={newLesson.type === 'PDF' ? "application/pdf" : "video/*"}
                                                    className="p-1 border rounded input-google transition-colors duration-200"
                                                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                                    required
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder={newLesson.type === 'LIVE_LINK' ? 'Zoom/Meet Linki' : 'URL'}
                                                    className="p-2 border rounded input-google transition-colors duration-200"
                                                    value={newLesson.url} onChange={e => setNewLesson({ ...newLesson, url: e.target.value })}
                                                    required
                                                />
                                            )}
                                        </div>
                                        <button type="submit" className="bg-green-600 text-white px-4 py-1 rounded text-sm w-full hover:bg-green-700">Kaydet</button>
                                    </form>
                                )}

                                <ul className="space-y-2">
                                    {mod.lessons?.map((lesson: any) => (
                                        <li key={lesson.id} className="flex items-center justify-between gap-2 p-2 bg-muted/40 rounded border border-border transition-colors duration-200">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">
                                                    {lesson.type === 'VIDEO' ? '🎥' :
                                                        lesson.type === 'PDF' ? '📄' :
                                                            lesson.type === 'LIVE_LINK' ? '📺' : '📝'}
                                                </span>
                                                <a href={lesson.url} target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">{lesson.title}</a>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                                                    {lesson.type === 'LIVE_LINK' ? 'Canlı' : lesson.type}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteLesson(lesson.id)}
                                                className="text-red-500 hover:text-red-700 text-sm opacity-60 hover:opacity-100"
                                                title="Sil"
                                            >
                                                🗑️
                                            </button>
                                        </li>
                                    ))}
                                    {mod.lessons?.length === 0 && <p className="text-sm text-gray-500 dark:text-slate-500">Henüz içerik yok.</p>}
                                </ul>
                            </div>
                        ))}

                    </div>
                </div>
            )}

            {activeTab === 'exams' && (
                <div>
                    <div className="mb-6">
                        <button
                            onClick={handleToggleExamForm}
                            className={`px-6 py-2 rounded font-bold transition-colors ${showExamForm ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                        >
                            {showExamForm ? 'Vazgec ve Sifirla' : '+ Yeni Sinav Olustur'}
                        </button>
                    </div>

                    {showExamForm && (

                        <div className="card-google p-6 mb-8">
                            <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Sinav Hazirla</h3>

                            <div className="flex gap-2 mb-6">
                                <button type="button" onClick={() => setShowBankModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700">Havuzdan Sec</button>
                                <button type="button" onClick={() => setIsRandomModalOpen(true)} className="bg-teal-600 text-white px-4 py-2 rounded text-sm hover:bg-teal-700">Rastgele Ekle</button>
                                <button type="button" onClick={handleShuffleOptions} className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700">Sıklari Karistir</button>
                            </div>

                            <form onSubmit={handleCreateExam}>
                                <input

                                    type="text" placeholder="Sinav Basligi"
                                    className="w-full p-2 border rounded mb-6 input-google transition-colors duration-200"
                                    value={newExamTitle} onChange={e => setNewExamTitle(e.target.value)}
                                    required
                                />

                                {/* Safe Exam Browser Toggle */}
                                <div className="mb-6 p-4 border rounded-lg bg-muted/40 border-border">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={requiresSeb}
                                            onChange={(e) => setRequiresSeb(e.target.checked)}
                                            className="w-5 h-5 accent-purple-600"
                                        />
                                        <div>
                                            <span className="font-bold text-foreground">🔒 Safe Exam Browser Zorunlu</span>
                                            <p className="text-xs text-muted-foreground">Öğrenciler bu sınava sadece SEB ile girebilir</p>
                                        </div>
                                    </label>
                                </div>

                                {/* Exam Duration */}
                                <div className="mb-6 p-4 border rounded-lg bg-muted/40 border-border">
                                    <label className="block text-sm font-medium mb-2 text-foreground">
                                        ⏱️ Sınav Süresi (Dakika)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Örn: 60 (Boş bırakılırsa süre sınırı yok)"
                                        className="w-full p-2 border rounded input-google"
                                        value={examDuration || ''}
                                        onChange={(e) => setExamDuration(e.target.value ? Number(e.target.value) : null)}
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        Süre dolduğunda sınav otomatik olarak gönderilir
                                    </p>
                                </div>

                                {/* Exam Deadline */}
                                <div className="mb-6 p-4 border rounded-lg bg-muted/40 border-border">
                                    <label className="block text-sm font-medium mb-2 text-foreground">
                                        📅 Son Giriş Tarihi (Deadline)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-2 border rounded input-google"
                                        value={examDeadline}
                                        onChange={(e) => setExamDeadline(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        Bu tarihten sonra öğrenciler sınava giremez ve 0 puan alırlar
                                    </p>
                                </div>

                                <div className="space-y-6 mb-6">
                                    {questions.map((q, qIndex) => (
                                        <div key={qIndex} className="p-4 card-google mb-4 relative">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-gray-500 dark:text-gray-400">Soru {qIndex + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(qIndex)}
                                                    className="text-red-500 hover:text-red-700 font-bold px-2"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                            <QuestionEditor
                                                initialData={q}
                                                onSave={(data) => updateQuestionData(qIndex, data)}
                                            />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-4">
                                    <button type="button" onClick={handleAddQuestion} className="bg-gray-200 dark:bg-slate-700 px-4 py-2 rounded text-gray-800 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600">
                                        + Soru Ekle
                                    </button>
                                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded ml-auto hover:bg-green-700">
                                        Sinavi Olustur
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-6">
                        {course.exams?.map((exam: any) => (

                            <div key={exam.id} className="p-6 card-google">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h4 className="font-bold text-lg dark:text-slate-100">{exam.title}</h4>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">{exam.questions?.length || 0} Soru</p>
                                    </div>
                                    <button
                                        onClick={() => fetchExamResults(exam.id)}
                                        className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-4 py-2 rounded text-sm font-semibold hover:bg-blue-200 dark:hover:bg-blue-800"
                                    >
                                        {showResultsFor === exam.id ? 'Sonuclari Gizle' : 'Sonuclari Gor'}
                                    </button>
                                </div>

                                {showResultsFor === exam.id && (
                                    <div className="mt-4 border-t border-gray-100 dark:border-slate-700 pt-4">
                                        <h5 className="font-bold text-gray-700 dark:text-slate-300 mb-3">Ogrenci Notlari</h5>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm text-left text-gray-500 dark:text-slate-400">
                                                <thead className="text-xs text-gray-700 dark:text-slate-300 uppercase bg-gray-50 dark:bg-slate-900">
                                                    <tr>
                                                        <th className="px-4 py-2">Ogrenci</th>
                                                        <th className="px-4 py-2">Email</th>
                                                        <th className="px-4 py-2">Puan</th>
                                                        <th className="px-4 py-2">Tarih</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {examResults.map((res: any) => (
                                                        <tr key={res.id} className="bg-[var(--card)] border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{res.user?.name || '-'}</td>
                                                            <td className="px-4 py-2 text-gray-600 dark:text-slate-300">{res.user?.email}</td>
                                                            <td className="px-4 py-2 font-bold text-blue-600 dark:text-blue-400">{res.score}</td>
                                                            <td className="px-4 py-2 text-gray-600 dark:text-slate-300">{new Date(res.completedAt).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                    {examResults.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="px-4 py-4 text-center">Henuz sinava giren yok.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {course.exams?.length === 0 && <p className="dark:text-slate-400">Henuz sinav olusturulmamis.</p>}
                    </div>
                </div>
            )}

            {activeTab === 'requests' && (
                <div>
                    <div className="card-google overflow-hidden">
                        <table className="min-w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Ogrenci</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Durum</th>
                                    <th className="px-6 py-3">Islem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map((enr: any) => (
                                    <tr key={enr.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:!text-white">{enr.user?.name}</td>
                                        <td className="px-6 py-4 text-gray-700 dark:!text-gray-100">{enr.user?.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${enr.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                enr.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                }`}>
                                                {enr.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {enr.status === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleUpdateEnrollment(enr.user.id, 'APPROVED')}
                                                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                                    >
                                                        Onayla
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateEnrollment(enr.user.id, 'REJECTED')}
                                                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                                                    >
                                                        Reddet
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {enrollments.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-4 text-center">Henuz kayit istegi yok.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'bank' && (
                <div>
                    {/* Excel Import Section */}
                    <div className="card-google p-6 mb-8">
                        <h3 className="text-xl font-bold mb-4 dark:text-slate-100">📥 Toplu Soru Yükleme</h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
                            Excel veya CSV dosyası ile birden fazla soruyu aynı anda yükleyebilirsiniz.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleDownloadTemplate}
                                className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                            >
                                📄 Şablonu İndir
                            </button>
                            <label className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer flex items-center gap-2 ${importLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {importLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Yükleniyor...
                                    </>
                                ) : (
                                    <>📤 Toplu Soru Yükle</>
                                )}
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleBulkUpload}
                                    disabled={importLoading}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-slate-500 mt-3">
                            💡 Desteklenen formatlar: .xlsx, .xls, .csv | Kolonlar: Type, Content, Options, CorrectAnswer
                        </p>
                    </div>

                    <div className="card-google p-6 mb-8">
                        <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Soru Bankasina Ekle</h3>
                        <QuestionEditor onSave={handleAddBankQuestion} />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold dark:text-slate-100">Havuzdaki Sorular</h3>
                        {bankQuestions.map((q) => (
                            <div key={q.id} className="card-google p-4 relative group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold mb-1 dark:text-slate-100">{q.text}</p>
                                        <span className="text-xs bg-gray-200 dark:bg-slate-700 px-2 py-1 rounded text-gray-700 dark:text-slate-300 font-mono">
                                            {q.type}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBankQuestion(q.id)}
                                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold px-2"
                                    >
                                        Sil
                                    </button>
                                </div>
                            </div>
                        ))}
                        {bankQuestions.length === 0 && <p className="text-gray-500 dark:text-slate-500">Havuzda soru yok.</p>}
                    </div>
                </div>
            )}

            {/* Modal for Selecting from Bank */}
            {showBankModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="card-google rounded-xl w-full max-w-2xl max-h-[80vh] shadow-2xl flex flex-col">
                        {/* Sticky Header */}
                        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold dark:text-[#e8eaed] flex justify-between items-center">
                                Havuzdan Soru Sec
                                <span className="text-sm font-normal text-gray-500 dark:text-[#9aa0a6]">
                                    {bankQuestions.filter(q => filterQuestionType === 'ALL' || q.type === filterQuestionType).length} soru
                                </span>
                            </h3>

                            {/* Question Type Filter */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">Soru Tipine Göre Filtrele</label>
                                <select
                                    className="w-full p-2 border rounded input-google text-gray-900 dark:text-white dark:bg-slate-800"
                                    value={filterQuestionType}
                                    onChange={(e) => { setFilterQuestionType(e.target.value); setSelectedBankQuestionIds([]); }}
                                >
                                    <option value="ALL" className="dark:bg-slate-800 dark:text-white">Tüm Tipler</option>
                                    <option value="MULTIPLE_CHOICE" className="dark:bg-slate-800 dark:text-white">Multiple Choice</option>
                                    <option value="MULTIPLE_SELECT" className="dark:bg-slate-800 dark:text-white">Multiple Select</option>
                                    <option value="TRUE_FALSE" className="dark:bg-slate-800 dark:text-white">True / False</option>
                                    <option value="SHORT_ANSWER" className="dark:bg-slate-800 dark:text-white">Short Answer</option>
                                    <option value="LONG_ANSWER" className="dark:bg-slate-800 dark:text-white">Long Answer</option>
                                    <option value="ORDERING" className="dark:bg-slate-800 dark:text-white">Ordering</option>
                                    <option value="MATCHING" className="dark:bg-slate-800 dark:text-white">Matching</option>
                                    <option value="FILL_IN_BLANKS" className="dark:bg-slate-800 dark:text-white">Fill in Blanks</option>
                                    <option value="NUMERIC" className="dark:bg-slate-800 dark:text-white">Numeric</option>
                                    <option value="CODE_SNIPPET" className="dark:bg-slate-800 dark:text-white">Code Snippet</option>
                                </select>
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 py-4">
                            <div className="space-y-2">
                                {bankQuestions
                                    .filter(q => filterQuestionType === 'ALL' || q.type === filterQuestionType)
                                    .map(q => (
                                        <label key={q.id} className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-all ${selectedBankQuestionIds.includes(q.id)
                                            ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400'
                                            : 'hover:bg-gray-50 border-gray-200 dark:border-gray-700 dark:hover:bg-[#303134]'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                className="mt-1 w-5 h-5 accent-blue-600"
                                                checked={selectedBankQuestionIds.includes(q.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedBankQuestionIds([...selectedBankQuestionIds, q.id]);
                                                    else setSelectedBankQuestionIds(selectedBankQuestionIds.filter(id => id !== q.id));
                                                }}
                                            />
                                            <div className="flex-1">
                                                <p className="font-semibold dark:!text-white text-gray-900 text-lg">{q.text}</p>
                                                <span className="text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded text-gray-700 dark:!text-white mt-1 inline-block font-medium">
                                                    {q.type}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                {bankQuestions.filter(q => filterQuestionType === 'ALL' || q.type === filterQuestionType).length === 0 && (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <p>Bu tipte soru bulunmuyor.</p>
                                        <button onClick={() => { setShowBankModal(false); setActiveTab('bank'); }} className="text-blue-600 hover:underline mt-2">
                                            Soru Bankasina Git
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-[var(--card)] rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowBankModal(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#303134] transition-colors"
                                >
                                    Iptal
                                </button>
                                <button
                                    onClick={handleAddFromBankToForm}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={selectedBankQuestionIds.length === 0}
                                >
                                    Seçilenleri Ekle ({selectedBankQuestionIds.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Random Add */}
            {isRandomModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="card-google rounded-xl w-full max-w-md shadow-2xl flex flex-col">
                        {/* Header */}
                        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold dark:text-[#e8eaed]">Rastgele Soru Ekle</h3>
                        </div>

                        {/* Content */}
                        <div className="p-6 py-4 flex-1 overflow-y-auto">
                            {/* Question Type Filter */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-slate-300">Soru Tipine Göre Filtrele</label>
                                <select
                                    className="w-full p-2 border rounded input-google text-gray-900 dark:text-white dark:bg-slate-800"
                                    value={filterQuestionType}
                                    onChange={(e) => setFilterQuestionType(e.target.value)}
                                >
                                    <option value="ALL" className="dark:bg-slate-800 dark:text-white">Tüm Tipler</option>
                                    <option value="MULTIPLE_CHOICE" className="dark:bg-slate-800 dark:text-white">Multiple Choice</option>
                                    <option value="MULTIPLE_SELECT" className="dark:bg-slate-800 dark:text-white">Multiple Select</option>
                                    <option value="TRUE_FALSE" className="dark:bg-slate-800 dark:text-white">True / False</option>
                                    <option value="SHORT_ANSWER" className="dark:bg-slate-800 dark:text-white">Short Answer</option>
                                    <option value="LONG_ANSWER" className="dark:bg-slate-800 dark:text-white">Long Answer</option>
                                    <option value="ORDERING" className="dark:bg-slate-800 dark:text-white">Ordering</option>
                                    <option value="MATCHING" className="dark:bg-slate-800 dark:text-white">Matching</option>
                                    <option value="FILL_IN_BLANKS" className="dark:bg-slate-800 dark:text-white">Fill in Blanks</option>
                                    <option value="NUMERIC" className="dark:bg-slate-800 dark:text-white">Numeric</option>
                                    <option value="CODE_SNIPPET" className="dark:bg-slate-800 dark:text-white">Code Snippet</option>
                                </select>
                            </div>

                            <div className="mb-2">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-[#e8eaed]">Kac soru eklensin?</label>
                                <input
                                    type="number"
                                    min="1"
                                    max={bankQuestions.filter(q => filterQuestionType === 'ALL' || q.type === filterQuestionType).length}
                                    value={randomCount}
                                    onChange={(e) => setRandomCount(Number(e.target.value))}
                                    className="w-full p-3 border rounded-lg input-google outline-none transition-all"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                    Filtreye uyan <span className="font-bold">{bankQuestions.filter(q => filterQuestionType === 'ALL' || q.type === filterQuestionType).length}</span> soru var.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700 bg-[var(--card)] rounded-b-xl">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsRandomModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#303134] transition-colors"
                                >
                                    Iptal
                                </button>
                                <button
                                    onClick={handleAddRandomToForm}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
                                    disabled={bankQuestions.filter(q => filterQuestionType === 'ALL' || q.type === filterQuestionType).length === 0}
                                >
                                    Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Özel Notlarım Tab */}
            {activeTab === 'notes' && (
                <div className="card-google p-6">
                    <h2 className="text-2xl font-bold mb-6 dark:text-slate-100">📝 Özel Notlarım</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        Bu notlar sadece size özeldir. Öğrenciler bu notları göremez.
                    </p>

                    {/* Not Ekleme Formu */}
                    <div className="mb-8">
                        <textarea
                            className="w-full p-4 h-32 mb-3 input-google resize-none"
                            placeholder="Bu dersle ilgili özel notunuzu yazın... (Örn: Sonraki hafta türev konusunu tekrar et)"
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                        />
                        <button
                            onClick={handleAddNote}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            💾 Notu Kaydet
                        </button>
                    </div>

                    {/* Not Listesi */}
                    <div className="space-y-4">
                        {notes.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                <p className="text-4xl mb-2">📝</p>
                                <p>Henüz özel notunuz yok.</p>
                            </div>
                        ) : (
                            notes.map(note => (
                                <div key={note.id} className="p-4 rounded-lg border bg-card border-border shadow-sm">
                                    <p className="whitespace-pre-wrap text-foreground">{note.content}</p>
                                    <div className="mt-3 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                        <span>📅 {new Date(note.createdAt).toLocaleString('tr-TR')}</span>
                                        <button
                                            onClick={() => handleDeleteNote(note.id)}
                                            className="text-red-500 hover:text-red-700 font-medium transition-colors flex items-center gap-1"
                                        >
                                            🗑️ Sil
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'gradebook' && (
                <div>
                    <h2 className="text-xl font-bold mb-4 dark:text-white">📊 Öğrenci Puanları</h2>
                    {course.hasLab && (
                        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                            <span className="text-purple-700 dark:text-purple-300 text-sm">🧪 Bu ders Laboratuvar içermektedir. Lab puanı girilebilir.</span>
                        </div>
                    )}
                    <div className="card-google overflow-hidden">
                        <table className="min-w-full text-sm text-left text-gray-500 dark:text-slate-400">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Öğrenci</th>
                                    <th className="px-6 py-3">Email</th>
                                    <th className="px-6 py-3">Durum</th>
                                    <th className="px-6 py-3">Genel Puan</th>
                                    {course.hasLab && <th className="px-6 py-3">Lab Puanı</th>}
                                    <th className="px-6 py-3">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.filter((e: any) => e.status === 'APPROVED').map((enr: any) => (
                                    <tr key={enr.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:!text-white">{enr.user?.name || '-'}</td>
                                        <td className="px-6 py-4 text-gray-700 dark:!text-gray-100">{enr.user?.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                {enr.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingRows.has(enr.user.id) || (enr.theoryScore === null && enr.labScore === null) ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    placeholder="-"
                                                    className="w-20 p-1 border rounded input-google text-center"
                                                    value={editingGrades[enr.user.id]?.theoryScore ?? enr.theoryScore ?? ''}
                                                    onChange={(e) => setEditingGrades(prev => ({
                                                        ...prev,
                                                        [enr.user.id]: {
                                                            ...prev[enr.user.id],
                                                            theoryScore: e.target.value ? parseFloat(e.target.value) : undefined
                                                        }
                                                    }))}
                                                />
                                            ) : (
                                                <span className="font-bold text-foreground">{enr.theoryScore ?? '-'}</span>
                                            )}
                                        </td>
                                        {course.hasLab && (
                                            <td className="px-6 py-4">
                                                {editingRows.has(enr.user.id) || (enr.theoryScore === null && enr.labScore === null) ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.1"
                                                        placeholder="-"
                                                        className="w-20 p-1 border rounded input-google text-center"
                                                        value={editingGrades[enr.user.id]?.labScore ?? enr.labScore ?? ''}
                                                        onChange={(e) => setEditingGrades(prev => ({
                                                            ...prev,
                                                            [enr.user.id]: {
                                                                ...prev[enr.user.id],
                                                                labScore: e.target.value ? parseFloat(e.target.value) : undefined
                                                            }
                                                        }))}
                                                    />
                                                ) : (
                                                    <span className="font-bold text-foreground">{enr.labScore ?? '-'}</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            {(enr.theoryScore != null || (course.hasLab && enr.labScore != null)) && !editingRows.has(enr.user.id) ? (
                                                <div className="flex gap-2">
                                                    <span className="bg-emerald-500 text-white px-3 py-1 rounded text-sm flex items-center">
                                                        ✅ Kaydedildi
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            setEditingRows(prev => new Set(prev).add(enr.user.id));
                                                            setEditingGrades(prev => ({
                                                                ...prev,
                                                                [enr.user.id]: {
                                                                    theoryScore: enr.theoryScore,
                                                                    labScore: enr.labScore
                                                                }
                                                            }));
                                                        }}
                                                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                                    >
                                                        ✏️ Düzenle
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        setSavingGrade(enr.user.id);
                                                        try {
                                                            const grades = editingGrades[enr.user.id] || {};
                                                            await api.put(`/courses/${id}/grade`, {
                                                                studentId: enr.user.id,
                                                                theoryScore: grades.theoryScore ?? enr.theoryScore,
                                                                labScore: grades.labScore ?? enr.labScore
                                                            });
                                                            fetchEnrollments();
                                                            setEditingGrades(prev => {
                                                                const newState = { ...prev };
                                                                delete newState[enr.user.id];
                                                                return newState;
                                                            });
                                                            setEditingRows(prev => {
                                                                const newState = new Set(prev);
                                                                newState.delete(enr.user.id);
                                                                return newState;
                                                            });
                                                        } catch (err) {
                                                            alert('Not kaydedilemedi.');
                                                        } finally {
                                                            setSavingGrade(null);
                                                        }
                                                    }}
                                                    disabled={savingGrade === enr.user.id}
                                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                                >
                                                    {savingGrade === enr.user.id ? '...' : '💾 Kaydet'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {enrollments.filter((e: any) => e.status === 'APPROVED').length === 0 && (
                                    <tr>
                                        <td colSpan={course.hasLab ? 6 : 5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            Henüz onaylanmış öğrenci yok.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </div>
    );
}
