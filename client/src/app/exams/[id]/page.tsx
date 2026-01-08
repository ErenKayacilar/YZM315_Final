'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import api from '../../../utils/api';
import { useRouter } from 'next/navigation';

import QuestionRenderer from '../../../components/QuestionRenderer';
import WebcamMonitor from '../../../components/WebcamMonitor';

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [exam, setExam] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [score, setScore] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [sebRequired, setSebRequired] = useState(false);
    const [sebError, setSebError] = useState<string | null>(null);

    // Timer state
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null); // in seconds
    const [timerStarted, setTimerStarted] = useState(false);
    const submitRef = useRef<() => Promise<void>>();

    const { id } = use(params);

    // Memoized submit function
    const handleSubmit = useCallback(async () => {
        try {
            const payload = Object.entries(answers).map(([qId, val]) => ({
                questionId: Number(qId),
                answer: val
            }));

            const res = await api.post('/exams/submit', {
                examId: Number(id),
                answers: payload
            });
            setScore(res.data.score);
        } catch (err: any) {
            if (err.response?.status === 403 && err.response?.data?.requiresSeb) {
                setSebRequired(true);
                setSebError('Bu sınava sadece Safe Exam Browser ile girilebilir.');
            } else {
                alert('Hata olustu.');
            }
        }
    }, [answers, id]);

    // Update ref when handleSubmit changes
    useEffect(() => {
        submitRef.current = handleSubmit;
    }, [handleSubmit]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = `/login?redirect=/exams/${id}`;
            return;
        }
        fetchExam();
    }, [id]);

    // Timer countdown effect
    useEffect(() => {
        if (!timerStarted || timeRemaining === null || score !== null) return;

        if (timeRemaining <= 0) {
            // Time's up - auto submit
            if (submitRef.current) {
                submitRef.current();
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeRemaining(prev => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearInterval(timer);
    }, [timerStarted, timeRemaining, score]);

    // Start timer when exam loads
    useEffect(() => {
        if (exam && exam.duration && !timerStarted && score === null) {
            setTimeRemaining(exam.duration * 60); // Convert minutes to seconds
            setTimerStarted(true);
        }
    }, [exam, timerStarted, score]);

    const fetchExam = async () => {
        try {
            const res = await api.get(`/exams/${id}`);
            setExam(res.data);
            setLoading(false);
        } catch (err: any) {
            setLoading(false);
            if (err.response?.status === 401) {
                window.location.href = `/login?redirect=/exams/${id}`;
                return;
            }
            if (err.response?.status === 403 && err.response?.data?.requiresSeb) {
                setSebRequired(true);
                setSebError(err.response?.data?.error || 'Safe Exam Browser gerekli');
            } else {
                alert('Sinav yuklenemedi.');
            }
        }
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleDownloadSebConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${baseUrl}/exams/${id}/seb-config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `exam_${id}.seb`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(errorData.error || 'SEB config indirilemedi');
            }
        } catch (err) {
            console.error('SEB config download error:', err);
            alert('SEB config indirilemedi - Sunucuya bağlanılamadı');
        }
    };

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Timer color based on remaining time
    const getTimerColor = () => {
        if (timeRemaining === null) return 'text-gray-600';
        if (timeRemaining <= 60) return 'text-red-600 animate-pulse'; // Last minute
        if (timeRemaining <= 300) return 'text-orange-500'; // Last 5 minutes
        return 'text-green-600';
    };

    if (loading) return <div className="p-10 text-center">Yukleniyor...</div>;

    // Show SEB required message
    if (sebRequired) {
        return (
            <div className="p-10 max-w-xl mx-auto">
                <div className="card-google p-8 text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-slate-100">
                        Safe Exam Browser Gerekli
                    </h1>
                    <p className="text-gray-600 dark:text-slate-400 mb-6">
                        {sebError || 'Bu sınava sadece Safe Exam Browser ile girilebilir.'}
                    </p>

                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6 text-left">
                        <h3 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">Nasıl Giriş Yapılır?</h3>
                        <ol className="list-decimal list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                            <li>Aşağıdaki butona tıklayarak SEB config dosyasını indirin</li>
                            <li>İndirilen <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">.seb</code> dosyasını açın</li>
                            <li>Safe Exam Browser otomatik olarak açılacaktır</li>
                            <li>LMS hesabınızla giriş yapın ve sınava başlayın</li>
                        </ol>
                    </div>

                    <button
                        onClick={handleDownloadSebConfig}
                        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors shadow-lg"
                    >
                        📥 SEB Config Dosyasını İndir
                    </button>

                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-4">
                        Safe Exam Browser yüklü değilse: <a href="https://safeexambrowser.org/download_en.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Buradan indirin</a>
                    </p>

                    <button
                        onClick={() => router.back()}
                        className="mt-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        ← Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    if (!exam) return <div className="p-10 text-center">Sinav bulunamadi.</div>;

    return (
        <div className="p-10 max-w-3xl mx-auto">
            {/* Webcam Monitor for SEB exams */}
            {exam.requiresSeb && score === null && <WebcamMonitor />}

            {/* Header with timer */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">{exam.title}</h1>

                {/* Timer display */}
                {exam.duration && timeRemaining !== null && score === null && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 ${getTimerColor()}`}>
                        <span className="text-2xl">⏱️</span>
                        <span className="text-2xl font-mono font-bold">
                            {formatTime(timeRemaining)}
                        </span>
                    </div>
                )}
            </div>

            {/* Duration info */}
            {exam.duration && score === null && (
                <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
                    ⏰ Bu sınavın süresi <strong>{exam.duration} dakika</strong>dır. Süre dolduğunda sınav otomatik olarak gönderilir.
                </div>
            )}

            {score !== null ? (
                <div className="card-google p-8 rounded text-center shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-[#e8eaed]">Sinav Tamamlandi!</h2>
                    <p className="text-xl mt-4 dark:text-[#9aa0a6]">Puaniniz: {score} / 100</p>

                    {exam.requiresSeb ? (
                        <div className="mt-6">
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                                SEB tarayıcısını kapatabilirsiniz.
                            </p>
                            <button
                                onClick={() => window.location.href = 'seb://quit'}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                            >
                                ✅ SEB'i Kapat
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => router.back()} className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                            Dön
                        </button>
                    )}
                </div>
            ) : (
                <div>
                    {exam.questions.map((q: any, index: number) => (
                        <div key={q.id} className="mb-8 p-6 card-google">
                            <h3 className="text-lg font-semibold mb-4 dark:text-slate-100">
                                <span className="text-gray-500 dark:text-gray-400 mr-2">{index + 1}.</span>
                                {q.text}
                            </h3>
                            <QuestionRenderer
                                question={q}
                                value={answers[q.id]}
                                onChange={(val) => handleAnswerChange(q.id, val)}
                            />
                        </div>
                    ))}

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-blue-600 text-white py-3 rounded text-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Sinavi Bitir
                    </button>
                </div>
            )}
        </div>
    );
}
