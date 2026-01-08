import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { api } from '@/context/AuthContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface Question {
    id: number;
    text: string;
    type: string;
    structure: any;
}

interface Exam {
    id: number;
    title: string;
    duration?: number;
    requiresSeb: boolean;
    questions: Question[];
    results?: any[];
}

export default function ExamTakingScreen() {
    const { t } = useTranslation();
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const [exam, setExam] = useState<Exam | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{ score: number } | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await api.get(`/exams/${id}`);
                setExam(res.data);

                if (res.data.results && res.data.results.length > 0) {
                    setResult({ score: res.data.results[0].score });
                } else if (res.data.duration) {
                    setTimeLeft(res.data.duration * 60);
                }
            } catch (err: any) {
                if (err.response?.data?.requiresSeb) {
                    setError('Bu sınav SEB gerektirir ve mobilde çözülemez.');
                } else {
                    setError(err.response?.data?.message || 'Sınav yüklenemedi.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchExam();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [id]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0 && !result) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev === null || prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => {
                if (timerRef.current) clearInterval(timerRef.current);
            };
        }
    }, [timeLeft, result]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const payload = Object.entries(answers).map(([qId, answer]) => ({
                questionId: Number(qId),
                answer,
            }));
            const res = await api.post('/exams/submit', { examId: Number(id), answers: payload });
            setResult({ score: res.data.score });
            if (timerRef.current) clearInterval(timerRef.current);
        } catch (err: any) {
            Alert.alert('Hata', err.response?.data?.message || 'Gönderim başarısız.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getOptionText = (opt: any): string => {
        if (typeof opt === 'string') return opt;
        return opt?.text || opt?.content || String(opt);
    };

    const renderQuestion = (question: Question) => {
        const currentAnswer = answers[question.id];
        const structure = typeof question.structure === 'string' ? JSON.parse(question.structure) : question.structure || {};
        const options = structure.options || [];

        switch (question.type) {
            case 'MULTIPLE_CHOICE':
            case 'TRUE_FALSE':
                return (
                    <View style={styles.optionsContainer}>
                        {options.map((opt: any, index: number) => {
                            const optText = getOptionText(opt);
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.optionButton, { backgroundColor: colors.card, borderColor: colors.border }, currentAnswer === optText && { borderColor: colors.tint, borderWidth: 2 }]}
                                    onPress={() => handleAnswerChange(question.id, optText)}
                                >
                                    <View style={[styles.optionRadio, { borderColor: currentAnswer === optText ? colors.tint : colors.border }, currentAnswer === optText && { backgroundColor: colors.tint }]} />
                                    <Text style={[styles.optionText, { color: colors.text }]}>{optText}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                );

            case 'MULTIPLE_SELECT':
                const selectedItems = Array.isArray(currentAnswer) ? currentAnswer : [];
                return (
                    <View style={styles.optionsContainer}>
                        {options.map((opt: any, index: number) => {
                            const optText = getOptionText(opt);
                            const isSelected = selectedItems.includes(optText);
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.optionButton, { backgroundColor: colors.card, borderColor: colors.border }, isSelected && { borderColor: colors.tint, borderWidth: 2 }]}
                                    onPress={() => {
                                        const newSelection = isSelected ? selectedItems.filter((i) => i !== optText) : [...selectedItems, optText];
                                        handleAnswerChange(question.id, newSelection);
                                    }}
                                >
                                    <View style={[styles.optionCheckbox, { borderColor: isSelected ? colors.tint : colors.border }, isSelected && { backgroundColor: colors.tint }]}>
                                        {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                                    </View>
                                    <Text style={[styles.optionText, { color: colors.text }]}>{optText}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                );

            case 'SHORT_ANSWER':
            case 'LONG_ANSWER':
            case 'NUMERIC':
                return (
                    <TextInput
                        style={[styles.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }, question.type === 'LONG_ANSWER' && styles.longTextInput]}
                        value={currentAnswer || ''}
                        onChangeText={(text) => handleAnswerChange(question.id, text)}
                        placeholder="Cevabınızı yazın..."
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        multiline={question.type === 'LONG_ANSWER'}
                        keyboardType={question.type === 'NUMERIC' ? 'numeric' : 'default'}
                    />
                );

            default:
                return <Text style={[styles.unsupportedText, { color: isDark ? '#94a3b8' : '#64748b' }]}>Bu soru türü ({question.type}) mobilde desteklenmiyor.</Text>;
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.tint} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="alert-circle" size={48} color="#f59e0b" />
                <Text style={[styles.errorTitle, { color: colors.text }]}>Sınav Açılamadı</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>{t('common.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (result) {
        return (
            <View style={[styles.resultContainer, { backgroundColor: colors.background }]}>
                <View style={[styles.resultCard, { backgroundColor: colors.card }]}>
                    <Ionicons name="checkmark-circle" size={64} color="#10b981" />
                    <Text style={[styles.resultTitle, { color: colors.text }]}>Sınav Tamamlandı!</Text>
                    <Text style={[styles.resultScore, { color: colors.tint }]}>{result.score}%</Text>
                    <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>{t('common.back')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!exam || exam.questions.length === 0) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Ionicons name="document-text-outline" size={48} color={isDark ? '#64748b' : '#94a3b8'} />
                <Text style={[styles.errorTitle, { color: colors.text }]}>Soru bulunamadı</Text>
                <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>{t('common.back')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentQuestion = exam.questions[currentIndex];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.examTitle, { color: colors.text }]} numberOfLines={1}>{exam.title}</Text>
                {timeLeft !== null && (
                    <View style={styles.timerContainer}>
                        <Ionicons name="time-outline" size={18} color={timeLeft < 60 ? '#ef4444' : colors.tint} />
                        <Text style={[styles.timerText, { color: timeLeft < 60 ? '#ef4444' : colors.text }]}>{formatTime(timeLeft)}</Text>
                    </View>
                )}
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                    <View style={[styles.progressFill, { width: `${((currentIndex + 1) / exam.questions.length) * 100}%`, backgroundColor: colors.tint }]} />
                </View>
                <Text style={[styles.progressText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    {currentIndex + 1} / {exam.questions.length}
                </Text>
            </View>

            {/* Question */}
            <ScrollView style={styles.questionContainer} contentContainerStyle={styles.questionContent}>
                <Text style={[styles.questionNumber, { color: colors.tint }]}>Soru {currentIndex + 1}</Text>
                <Text style={[styles.questionText, { color: colors.text }]}>{currentQuestion.text}</Text>
                {renderQuestion(currentQuestion)}
            </ScrollView>

            {/* Navigation */}
            <View style={[styles.navigation, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={styles.navButton} onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>
                    <Ionicons name="chevron-back" size={24} color={currentIndex === 0 ? '#64748b' : colors.text} />
                    <Text style={[styles.navButtonText, { color: currentIndex === 0 ? '#64748b' : colors.text }]}>Önceki</Text>
                </TouchableOpacity>

                {currentIndex === exam.questions.length - 1 ? (
                    <TouchableOpacity style={[styles.submitButton, { backgroundColor: '#10b981' }]} onPress={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitButtonText}>Gönder</Text>}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.navButton} onPress={() => setCurrentIndex((i) => Math.min(exam.questions.length - 1, i + 1))}>
                        <Text style={[styles.navButtonText, { color: colors.text }]}>Sonraki</Text>
                        <Ionicons name="chevron-forward" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorTitle: { fontSize: 24, fontWeight: '700', marginTop: 16 },
    errorText: { color: '#f59e0b', fontSize: 14, textAlign: 'center', marginTop: 8 },
    backButton: { marginTop: 24, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
    backButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    resultCard: { padding: 40, borderRadius: 20, alignItems: 'center', width: '100%' },
    resultTitle: { fontSize: 24, fontWeight: '700', marginTop: 20 },
    resultScore: { fontSize: 48, fontWeight: '700', marginTop: 16 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    examTitle: { flex: 1, fontSize: 18, fontWeight: '600', marginHorizontal: 16 },
    timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    timerText: { fontSize: 18, fontWeight: '700', fontFamily: 'SpaceMono' },
    progressContainer: { padding: 16, alignItems: 'center' },
    progressBar: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressText: { marginTop: 8, fontSize: 13 },
    questionContainer: { flex: 1 },
    questionContent: { padding: 20 },
    questionNumber: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    questionText: { fontSize: 18, fontWeight: '600', lineHeight: 26, marginBottom: 24 },
    optionsContainer: { gap: 12 },
    optionButton: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
    optionRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, marginRight: 12 },
    optionCheckbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    optionText: { fontSize: 16, flex: 1 },
    textInput: { borderWidth: 1, borderRadius: 12, padding: 16, fontSize: 16, minHeight: 50 },
    longTextInput: { minHeight: 150, textAlignVertical: 'top' },
    unsupportedText: { fontSize: 14, fontStyle: 'italic' },
    navigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1 },
    navButton: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 4 },
    navButtonText: { fontSize: 16, fontWeight: '500' },
    submitButton: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
